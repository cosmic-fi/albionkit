import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ category: string }>;
};

export default async function BuildsCategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const category = resolvedParams.category;
  redirect(`/builds?category=${encodeURIComponent(category)}`);
}
