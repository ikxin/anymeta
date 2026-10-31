import type { ApiOperation, ApiOperationRoute } from '~/utils/openapi'

const platformLabels: Record<string, string> = {
  github: 'GitHub',
  npmjs: 'npmjs',
  crates: 'crates.io',
  pypi: 'PyPI',
  opencollective: 'OpenCollective',
}

interface ApiCategory {
  id: string
  label: string
  operations: ApiOperation[]
}

interface ApiPlatform {
  id: string
  label: string
  categories: ApiCategory[]
}

export function operationLink(operation: ApiOperationRoute) {
  const segments = [operation.platform, operation.category, operation.endpoint]
  return `/docs/${segments.map(encodeURIComponent).join('/')}`
}

export function findOperationByRoute(
  operations: ApiOperation[],
  params: { platform?: unknown; category?: unknown; endpoint?: unknown },
) {
  return operations.find(
    (operation) =>
      operation.platform === params.platform &&
      operation.category === params.category &&
      operation.endpoint === params.endpoint,
  )
}

export function groupOperations(operations: ApiOperation[]) {
  const platforms = new Map<string, ApiPlatform>()

  for (const operation of operations) {
    let platform = platforms.get(operation.platform)
    if (!platform) {
      platform = {
        id: operation.platform,
        label: platformLabels[operation.platform] || operation.platform,
        categories: [],
      }
      platforms.set(platform.id, platform)
    }

    let category = platform.categories.find((category) => category.id === operation.category)
    if (!category) {
      const prefix = `${platform.label} `
      category = {
        id: operation.category,
        label: operation.tag.startsWith(prefix) ? operation.tag.slice(prefix.length) : operation.tag,
        operations: [],
      }
      platform.categories.push(category)
    }
    category.operations.push(operation)
  }

  return [...platforms.values()]
}
