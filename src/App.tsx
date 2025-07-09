import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { URLInput } from './components/URLInput';
import { CrawlingAnimation } from './components/CrawlingAnimation';
import { ResultsDisplay } from './components/ResultsDisplay';
export function App() {
  const [crawlingStatus, setCrawlingStatus] = useState('idle'); // idle, crawling, completed
  const [progress, setProgress] = useState(0);
  const handleStartCrawl = (url: string) => {
    setCrawlingStatus('crawling');
    // Simulate crawling process
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setCrawlingStatus('completed');
      }
    }, 200);
  };
  return <Layout>
      {crawlingStatus === 'idle' && <URLInput onStartCrawl={handleStartCrawl} />}
      {crawlingStatus === 'crawling' && <CrawlingAnimation progress={progress} />}
      {crawlingStatus === 'completed' && <>
          <Dashboard />
          <ResultsDisplay />
        </>}
    </Layout>;
}