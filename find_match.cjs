const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('App.tsx', 'utf8');

// Let's find where line 7520 ends
const lines = code.split('\n');
const prefix = lines.slice(0, 7520).join('\n');

const testEndings = [
  // Ending 1
  `                              <button key={token.id} disabled={selectedWordIds.includes(token.id) || feedback.status !== 'idle'} onClick={() => { playSound('click'); setSelectedWordIds(p => [...p, token.id]); }} className={\`bg-duo-card border-2 border-b-4 border-gray-700 p-2 px-4 md:p-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none \${isArTok ? 'font-arabic' : ''}\`}>
                                {formatRTLOverride(token.text)}
                              </button>
                            );
                          })}
                        </div>
                        </>
                      )}
                    </div>
                  </div>
              )}

              <div className="mt-auto pt-4 border-t-2 border-gray-800 flex items-center justify-between gap-4 relative z-20 flex-shrink-0">
                {feedback.status === 'idle' ? (
                  <>
                    <button onClick={handleSkip} className="px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider text-sm md:text-base">{t('t_skip')}</button>
                    <button onClick={() => { if (feedback.status !== 'idle') handleContinueAfterLesson(); else if (currentExercise.type === 'drawing') checkDrawingAnswer(); else if (selectedWordIds.length > 0 || currentExercise.type === 'speech' || currentExercise.type === 'ishihara') checkAnswer(); }} className={\`w-full py-4 md:py-7 rounded-2xl md:rounded-[2.5rem] font-bold text-xl md:text-2xl transition-all uppercase tracking-widest shadow-2xl active:translate-y-2 active:border-b-0 \${selectedWordIds.length > 0 || feedback.status !== 'idle' || currentExercise.type === 'speech' || currentExercise.type === 'drawing' || (currentExercise.type === 'ishihara' && ishiharaInput) ? 'bg-duo-green border-b-8 border-duo-greenDark text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}\`}>{t('check')}</button>
                  </>
                ) : (
                  <div className={\`w-full flex flex-col md:flex-row items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl \${feedback.status === 'correct' ? 'bg-duo-green/20 border-2 border-duo-green' : 'bg-duo-red/20 border-2 border-duo-red'}\`}>
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <span className="text-3xl md:text-5xl">{feedback.status === 'correct' ? '🎉' : '❌'}</span>
                      <div>
                        <h3 className={\`font-black text-xl md:text-2xl \${feedback.status === 'correct' ? 'text-duo-green' : 'text-duo-red'}\`}>{feedback.status === 'correct' ? (user.language === 'ru' ? 'Отлично!' : 'Great job!') : (user.language === 'ru' ? 'Решение:' : 'Solution:')}</h3>
                        <p className="text-gray-300 font-bold text-sm md:text-lg">{feedback.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <button onClick={handleExplainWithAI} className="p-3 md:p-4 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:bg-gray-700 transition-all text-xs md:text-sm font-bold flex items-center space-x-2"><SparklesIcon className="w-5 h-5 text-amber-400" /><span>AI Explanation</span></button>
                      <button onClick={() => handleContinueAfterLesson()} className={\`w-full md:w-auto px-10 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-3xl font-bold text-white border-b-4 transition-all hover:scale-105 active:translate-y-1 \${feedback.status === 'correct' ? 'bg-duo-green border-duo-greenDark shadow-xl shadow-duo-green/20' : 'bg-duo-red border-red-800'}\`}>{t('next')}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      )}

      {showExplanationModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowExplanationModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"><CloseIcon className="w-6 h-6"/></button>
            <div className="flex items-center space-x-3 mb-4">
              <SparklesIcon className="w-8 h-8 text-amber-400" />
              <h3 className="text-xl md:text-2xl font-black text-white">AI Explanation</h3>
            </div>
            {explanationLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold text-sm">Analyzing with AI...</p>
              </div>
            ) : (
              <div className="text-gray-200 text-sm md:text-base leading-relaxed max-h-[60vh] overflow-y-auto pr-2 whitespace-pre-wrap font-sans">
                {explanation}
              </div>
            )}
            <button onClick={() => setShowExplanationModal(false)} className="w-full mt-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm">{t('close')}</button>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-center">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"><CloseIcon className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-white mb-2">⚡ Limit Reached</h3>
            <p className="text-gray-300 font-bold text-sm mb-6">Switching to cached offline mode due to high request volume.</p>
            <button onClick={() => setShowLimitModal(false)} className="w-full py-3.5 bg-duo-green hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all uppercase text-sm shadow-lg">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}`
];

for (let i = 0; i < testEndings.length; i++) {
  const fullCode = prefix + '\n' + testEndings[i];
  try {
    parser.parse(fullCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    console.log("MATCH FOUND for option", i);
  } catch (e) {
    console.log("Option", i, "Error:", e.message, "at", e.loc);
  }
}
