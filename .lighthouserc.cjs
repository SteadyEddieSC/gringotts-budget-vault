const budgets = require('./lighthouse-budget.json');

module.exports = {
  ci: {
    collect: {
      staticDistDir: '.',
      url: ['http://localhost/index.html?quality=v112'],
      numberOfRuns: 2,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        budgets,
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage --disable-gpu'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'interactive': ['error', { maxNumericValue: 5000 }],
        'total-blocking-time': ['error', { maxNumericValue: 600 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.10 }],
        'errors-in-console': ['error', { maxLength: 0 }],
        'network-requests': ['error', { maxLength: 45 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci'
    }
  }
};
