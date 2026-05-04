import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: object;
}

export function SEO({ title, description, canonical, ogType = 'website', ogImage, jsonLd }: SEOProps) {
  const siteName = 'PrepNext';
  const fullTitle = `${title} | ${siteName}`;
  const baseUrl = 'https://www.prepnext.in';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={`${baseUrl}${canonical}`} />}
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
