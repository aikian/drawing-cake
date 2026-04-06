import DesignPageClient from './DesignPageClient'

interface SearchParams {
  type?: string
}

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const productType = params.type === 'donut' ? 'donut' : 'cake'

  return <DesignPageClient productType={productType} />
}
