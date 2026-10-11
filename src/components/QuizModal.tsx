import React, { useState } from 'react';
import { Experiment } from '../data/experimentsData';
import { api } from '../services/api';
import { X, CheckCircle2, XCircle, Award, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface QuizModalProps {
  experiment: Experiment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  experiment,
  isOpen,
  onClose,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    details: Array<{
      questionId: string;
      questionText: string;
      options: string[];
      selectedIndex?: number;
      correctIndex: number;
      isCorrect: boolean;
      explanation: string;
    }>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !experiment) return null;

  const handleOptionSelect = (qId: string, optIdx: number) => {
    if (quizResult) return; // locked after submission
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check if all answered
    const unanswered = experiment.quiz.filter(q => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      setErrorMsg(`يرجى الإجابة عن جميع الأسئلة قبل التسليم (المتبقي: ${unanswered.length} سؤال)`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitQuiz(experiment.id, selectedAnswers);
      setQuizResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تصحيح الاختبار');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
            <span>اختبار تقييمي</span>
            <span>·</span>
            <span>تجربة #{experiment.number}</span>
          </div>
          <h2 className="text-xl font-bold text-white">{experiment.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            أجب عن الأسئلة للتحقق من استيعابك للمفاهيم الفيزيائية والهندسية
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quiz Results Banner */}
        {quizResult && (
          <div className={`mb-6 p-4 rounded-xl border text-center ${
            quizResult.passed
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
          }`}>
            <Award className={`w-8 h-8 mx-auto mb-1 ${quizResult.passed ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div className="text-lg font-bold">
              {quizResult.passed ? 'أحسنت! اجتزت الاختبار بنجاح' : 'تحتاج لمراجعة التجربة والمحاولة مجددًا'}
            </div>
            <div className="text-xs mt-1 font-mono-numbers">
              النتيجة: {quizResult.score} من أصل {quizResult.total} ({quizResult.percentage}%)
            </div>
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {experiment.quiz.map((q, qIdx) => {
            const selected = selectedAnswers[q.id];
            const resultDetail = quizResult?.details.find(d => d.questionId === q.id);

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono-numbers flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <div className="font-bold text-sm text-slate-100 leading-relaxed">
                    {q.question}
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2 pr-7">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selected === optIdx;
                    let optionStyle = 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600';

                    if (quizResult && resultDetail) {
                      if (optIdx === resultDetail.correctIndex) {
                        optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold';
                      } else if (isSelected && !resultDetail.isCorrect) {
                        optionStyle = 'bg-red-950/40 border-red-500 text-red-300 line-through';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-emerald-600/20 border-emerald-500 text-white font-medium';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleOptionSelect(q.id, optIdx)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{opt}</span>
                        </div>

                        {quizResult && resultDetail && (
                          optIdx === resultDetail.correctIndex ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isSelected && !resultDetail.isCorrect ? (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          ) : null
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scientific Explanation after submission */}
                {quizResult && resultDetail && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] leading-relaxed text-slate-300">
                    <span className="font-bold text-emerald-400 ml-1">التفسير العلمي:</span>
                    {resultDetail.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            {quizResult ? (
              <button
                type="button"
                onClick={handleRetake}
                className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة الاختبار</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-colors flex items-center gap-2"
              >
                {loading ? 'جارٍ التصحيح...' : 'تسليم الإجابات'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
