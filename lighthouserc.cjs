module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.90, aggregationMethod: 'median-run' }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000, aggregationMethod: 'median-run' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.10, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['error', { maxNumericValue: 250, aggregationMethod: 'median-run' }],
        'speed-index': ['warn', { maxNumericValue: 3200, aggregationMethod: 'median-run' }],
        'interactive': ['warn', { maxNumericValue: 3500, aggregationMethod: 'median-run' }],
        'total-byte-weight': ['error', { maxNumericValue: 750000, aggregationMethod: 'median-run' }],
        'resource-summary:script:size': ['error', { maxNumericValue: 500000, aggregationMethod: 'median-run' }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 150000, aggregationMethod: 'median-run' }],
        'resource-summary:image:size': ['error', { maxNumericValue: 250000, aggregationMethod: 'median-run' }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};
