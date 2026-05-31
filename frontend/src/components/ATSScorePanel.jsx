import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { trackEvent } from '@/lib/analytics';
import { getATSScore } from '@/lib/api';

/**
 * ATSScorePanel — Allows users to check their resume's ATS compatibility
 * against a job description. Displays score (0-100), matched/missing terms,
 * and the scoring method used (semantic vs heuristic).
 *
 * @param {string} cvText - The full text of the user's resume
 * @param {function} [onCheckScore] - Optional callback to override the default API call.
 *   Should accept (cvText, jobDescription) and return a promise resolving to
 *   { score, matched_terms, missing_terms, method }
 */
export default function ATSScorePanel({ cvText, onCheckScore }) {
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckScore = async () => {
    if (!jobDescription.trim()) return;

    setLoading(true);
    setError(null);

    // Fire GA4 event when score is requested
    trackEvent('ats_score_checked');

    try {
      const scorer = onCheckScore || getATSScore;
      const res = await scorer(cvText, jobDescription);
      setResult(res);
    } catch (e) {
      setError('Failed to check ATS score. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#0f0f10] border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">ATS Score Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            className="bg-[#081018] text-white border-gray-600 placeholder:text-gray-500"
            placeholder="Paste the job description here to check your resume's ATS compatibility..."
          />
        </div>

        <Button
          onClick={handleCheckScore}
          disabled={loading || !jobDescription.trim()}
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
        >
          {loading ? 'Checking...' : 'Check Score'}
        </Button>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {result && (
          <div className="space-y-4 pt-2">
            {/* Score display */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-[#0066ff]">
                {result.score}
              </span>
              <span className="text-gray-400 text-lg">/100</span>
              <Badge
                variant="outline"
                className={
                  result.method === 'semantic'
                    ? 'border-green-500 text-green-400 ml-auto'
                    : 'border-yellow-500 text-yellow-400 ml-auto'
                }
              >
                {result.method === 'semantic' ? '✓ Semantic' : '⚡ Heuristic'}
              </Badge>
            </div>

            {/* Matched terms */}
            {result.matched_terms && result.matched_terms.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Matched Terms</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_terms.map((term, i) => (
                    <Badge
                      key={i}
                      className="bg-green-900/40 text-green-300 border-green-700"
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing terms */}
            {result.missing_terms && result.missing_terms.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Missing Terms</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_terms.map((term, i) => (
                    <Badge
                      key={i}
                      className="bg-red-900/40 text-red-300 border-red-700"
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
