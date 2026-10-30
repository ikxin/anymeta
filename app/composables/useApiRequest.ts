import type { ApiOperation, ApiParameter, OpenApiDocument } from '~/utils/openapi'
import { mediaExample, parameterValue } from '~/utils/openapi'

interface RequestResult {
  status: number
  statusText: string
  duration: number
  size: number
  body: string
  headers: string
  contentType: string
}

export function useApiRequest(operation: ApiOperation, document: OpenApiDocument) {
  const { t } = useI18n()
  const origin = useRequestURL().origin
  const values = reactive<Record<string, string>>(
    Object.fromEntries(
      operation.parameters.map((parameter) => [parameterKey(parameter), parameterValue(parameter)]),
    ),
  )
  const contentTypes = Object.keys(operation.requestBody?.content || {})
  const contentType = ref(
    contentTypes.includes('application/json') ? 'application/json' : contentTypes[0] || '',
  )
  const body = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const error = ref('')
  const pending = ref(false)
  const result = shallowRef<RequestResult>()
  let controller: AbortController | undefined

  const isJson = computed(() => /(?:\/|\+)json(?:;|$)/i.test(contentType.value))
  const hasBody = Boolean(operation.requestBody && !['GET', 'HEAD'].includes(operation.method))

  function resetBody() {
    const media = operation.requestBody?.content[contentType.value]
    const example = media ? mediaExample(document, media) : undefined
    body.value =
      example === undefined ? '' : isJson.value ? JSON.stringify(example, null, 2) : String(example)
  }

  watch(contentType, resetBody, { immediate: true })

  const requestUrl = computed(() => {
    const path = operation.path.replace(/\{([^{}]+)\}/g, (placeholder, name: string) => {
      const value = values[`path:${name}`]
      return value ? encodeURIComponent(value) : placeholder
    })
    const query = new URLSearchParams()
    for (const parameter of operation.parameters) {
      const value = values[parameterKey(parameter)]
      if (parameter.in === 'query' && value !== undefined && value !== '')
        query.append(parameter.name, value)
    }
    return `${origin}${path}${query.size ? `?${query}` : ''}`
  })

  const requestHeaders = computed(() => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    for (const parameter of operation.parameters) {
      const value = values[parameterKey(parameter)]
      if (parameter.in === 'header' && value?.trim()) headers[parameter.name] = value.trim()
    }
    if (hasBody && contentType.value) headers['Content-Type'] = contentType.value
    return headers
  })

  const curl = computed(() => {
    const lines = [
      `curl --globoff ${shellQuote(requestUrl.value)}`,
      `  --request ${operation.method}`,
    ]
    for (const [name, value] of Object.entries(requestHeaders.value))
      lines.push(`  --header ${shellQuote(`${name}: ${value}`)}`)
    if (hasBody && body.value.trim()) lines.push(`  --data-raw ${shellQuote(body.value)}`)
    return lines.join(' \\\n')
  })

  const javascript = computed(() => {
    const options = {
      method: operation.method,
      headers: requestHeaders.value,
      credentials: 'omit',
      redirect: 'error',
      ...(hasBody && body.value.trim() ? { body: body.value } : {}),
    }
    return `const response = await fetch(${JSON.stringify(requestUrl.value)}, ${JSON.stringify(options, null, 2)});\n\nconst text = await response.text();\nconsole.log(response.status, text);`
  })

  function validate() {
    const errors: Record<string, string> = {}
    for (const parameter of operation.parameters) {
      const key = parameterKey(parameter)
      const value = values[key] ?? ''
      const schema = parameter.schema
      const types = Array.isArray(schema?.type) ? schema.type : [schema?.type]
      if (parameter.required && !value.trim()) errors[key] = t('ui.errors.requiredParameter')
      else if (parameter.in === 'path' && ['.', '..'].includes(value))
        errors[key] = t('ui.errors.invalidPath')
      else if (parameter.in === 'cookie' && value) errors[key] = t('ui.errors.cookieUnsupported')
      else if (value && schema?.enum && !schema.enum.some((item) => String(item) === value))
        errors[key] = t('ui.errors.invalidEnum')
      else if (value && (types.includes('integer') || types.includes('number'))) {
        const number = Number(value)
        if (!Number.isFinite(number) || (types.includes('integer') && !Number.isInteger(number)))
          errors[key] = t('ui.errors.invalidNumber')
        else if (schema?.minimum !== undefined && number < schema.minimum)
          errors[key] = t('ui.errors.minimum', { value: schema.minimum })
        else if (schema?.maximum !== undefined && number > schema.maximum)
          errors[key] = t('ui.errors.maximum', { value: schema.maximum })
      }
    }
    if (hasBody) {
      if (operation.requestBody?.required && !body.value.trim())
        errors.body = t('ui.errors.requiredBody')
      else if (isJson.value && body.value.trim()) {
        try {
          JSON.parse(body.value)
        } catch {
          errors.body = t('ui.errors.invalidJson')
        }
      }
    }
    fieldErrors.value = errors
    return !Object.keys(errors).length
  }

  function reset() {
    if (pending.value) return
    for (const parameter of operation.parameters)
      values[parameterKey(parameter)] = parameterValue(parameter)
    resetBody()
    fieldErrors.value = {}
    error.value = ''
    result.value = undefined
  }

  async function execute() {
    if (pending.value) return
    error.value = ''
    if (!validate()) {
      error.value = t('ui.errors.validationFailed')
      return
    }

    const currentController = new AbortController()
    controller = currentController
    pending.value = true
    result.value = undefined
    const started = performance.now()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      currentController.abort()
    }, 30000)

    try {
      const url = new URL(requestUrl.value)
      if (url.origin !== origin) throw new Error(t('ui.errors.foreignOrigin'))
      const response = await fetch(url, {
        method: operation.method,
        headers: requestHeaders.value,
        body: hasBody && body.value.trim() ? body.value : undefined,
        credentials: 'omit',
        redirect: 'error',
        signal: currentController.signal,
      })
      const text = await response.text()
      let formatted = text
      try {
        formatted = text ? JSON.stringify(JSON.parse(text), null, 2) : ''
      } catch {
        /* 保留非 JSON 响应。 */
      }
      if (controller !== currentController) return
      result.value = {
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(performance.now() - started),
        size: new TextEncoder().encode(text).length,
        body: formatted,
        headers: Array.from(response.headers, ([key, value]) => `${key}: ${value}`).join('\n'),
        contentType: response.headers.get('content-type') || 'text/plain',
      }
    } catch (cause) {
      if (controller !== currentController) return
      error.value = currentController.signal.aborted
        ? timedOut
          ? t('ui.errors.timeout', { seconds: 30 })
          : t('ui.errors.canceled')
        : cause instanceof Error
          ? t('ui.errors.failed', { message: cause.message })
          : t('ui.errors.network')
    } finally {
      clearTimeout(timer)
      if (controller === currentController) {
        pending.value = false
        controller = undefined
      }
    }
  }

  onBeforeUnmount(() => {
    controller?.abort()
    controller = undefined
  })

  return {
    origin,
    values,
    contentTypes,
    contentType,
    body,
    hasBody,
    fieldErrors,
    error,
    pending,
    result,
    requestUrl,
    requestHeaders,
    curl,
    javascript,
    execute,
    reset,
    resetBody,
    cancel: () => controller?.abort(),
  }
}

export function parameterKey(parameter: ApiParameter) {
  return `${parameter.in}:${parameter.name}`
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`
}
