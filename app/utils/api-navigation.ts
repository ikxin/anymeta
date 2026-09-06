import type { ApiOperation } from '~/utils/openapi'

export function operationLink(operation: Pick<ApiOperation, 'id'>) {
  return `/docs/${encodeURIComponent(operation.id)}`
}
