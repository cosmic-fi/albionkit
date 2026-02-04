import { Metadata } from 'next';
import { getBuild } from '@/lib/builds-service';
import { BuildView } from './BuildView';

interface PageProps {
    params: Promise<{ category: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const build = await getBuild(id);

    if (!build) {
        return {
            title: 'Build Not Found | AlbionKit',
            description: 'The requested build could not be found.',
        };
    }

    return {
        title: `${build.title} | AlbionKit`,
        description: build.description || `Check out this ${build.category} build by ${build.authorName} on AlbionKit.`,
        openGraph: {
            title: build.title,
            description: build.description || `Check out this ${build.category} build by ${build.authorName} on AlbionKit.`,
            type: 'article',
        },
    };
}

export default async function BuildPage({ params }: PageProps) {
    const resolvedParams = await params;
    const build = await getBuild(resolvedParams.id);

    const jsonLd = build ? {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: build.title,
      description: build.description,
      author: {
        '@type': 'Person',
        name: build.authorName
      },
      datePublished: build.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      image: 'https://albionkit.com/og-image.jpg', // ideally dynamic if builds have images
      publisher: {
        '@type': 'Organization',
        name: 'AlbionKit',
        logo: {
          '@type': 'ImageObject',
          url: 'https://albionkit.com/logo.png'
        }
      }
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <BuildView id={resolvedParams.id} category={resolvedParams.category} />
        </>
    );
}
