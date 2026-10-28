import React from 'react';
import { LabCatalogHub } from '../../components/lab/lab-catalog-hub.tsx';

export const metadata = {
  title: 'Interactive STEM Labs | Edukriti',
  description: 'Virtual science laboratories that teachers can demonstrate and learners can run with instrument least-count precision and auto-graded reports.',
};

export default function LabsCatalogPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-10 px-4">
      <LabCatalogHub />
    </main>
  );
}

