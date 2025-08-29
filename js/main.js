/**
 * 또바기 어린이집 설문조사 대시보드
 * 메인 JavaScript 파일
 */

// 전역 변수
let surveyData = null;
let charts = {};

/**
 * JSON 데이터 로드
 */
async function loadSurveyData() {
    const isAuthenticated = sessionStorage.getItem('ddobagi_authenticated');
    if (isAuthenticated !== 'true') {
        console.log('인증되지 않은 접근');
        return;
    }
    
    try {
        // 먼저 외부 JSON 파일 로드 시도
        try {
            const response = await fetch('./data/survey1.json');
            if (response.ok) {
                surveyData = await response.json();
                console.log('외부 JSON 파일 로드 성공');
                initializeDashboard();
                return;
            }
        } catch (fetchError) {
            console.log('외부 JSON 파일 로드 실패, 임베드된 데이터 사용');
        }
        
        // 외부 파일 로드 실패 시 HTML에 임베드된 데이터 사용
        console.log('임베드된 설문조사 데이터로 대시보드 초기화');
        initializeDashboard();
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showError('설문 데이터를 불러오는데 실패했습니다.');
    }
}

/**
 * 대시보드 초기화
 */
function initializeDashboard() {
    if (!surveyData) return;
    
    // 통계 업데이트
    updateStats();
    
    // 섹션 생성
    createSections();
    
    // 요약 생성
    createSummary();
    
    console.log('대시보드 초기화 완료');
}

/**
 * 상단 통계 업데이트
 */
function updateStats() {
    const respondentCount = document.getElementById('respondentCount');
    const satisfactionScore = document.getElementById('satisfactionScore');
    
    if (surveyData.meta) {
        respondentCount.textContent = `${surveyData.meta.respondentCount || 35}명`;
        satisfactionScore.textContent = `${surveyData.meta.satisfactionScore || 6.6}/10`;
    }
}

/**
 * 설문 섹션들 생성
 */
function createSections() {
    const container = document.getElementById('sectionsContainer');
    const questions = surveyData.questions || [];
    
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const sectionElement = createSectionElement(question, index + 1);
        container.appendChild(sectionElement);
    });
}

/**
 * 섹션 요소 생성
 */
function createSectionElement(question, questionNumber) {
    const section = document.createElement('div');
    section.className = 'section-card';
    section.innerHTML = `
        <div class="section-header" onclick="toggleSection('question${questionNumber}')">
            <div class="section-title-area">
                <div class="section-icon">${getQuestionIcon(question.type)}</div>
                <div>
                    <div class="section-number">설문 문항 ${questionNumber}</div>
                    <div class="section-title">${question.title}</div>
                </div>
            </div>
            <div class="chevron" id="chevron${questionNumber}">⌄</div>
        </div>
        <div class="section-content" id="content${questionNumber}">
            ${createQuestionContent(question, questionNumber)}
        </div>
    `;
    
    return section;
}

/**
 * 질문 타입별 아이콘 반환
 */
function getQuestionIcon(type) {
    const icons = {
        'choice': '📊',
        'satisfaction': '⭐',
        'narrative': '💬'
    };
    return icons[type] || '📊';
}

/**
 * 질문 내용 생성
 */
function createQuestionContent(question, questionNumber) {
    switch (question.type) {
        case 'choice':
            return createChartContent(question, questionNumber);
        case 'satisfaction':
            return createSatisfactionContent(question);
        case 'narrative':
            return createNarrativeContent(question);
        default:
            return '<div class="coming-soon"><h4>준비 중입니다</h4><p>해당 설문 문항의 데이터를 준비 중입니다.</p></div>';
    }
}

/**
 * 막대그래프 차트 콘텐츠 생성 (문항 1, 2, 8, 9)
 */
function createChartContent(question, questionNumber) {
    return `
        <div class="chart-container">
            <div class="chart-wrapper">
                <canvas id="chart${questionNumber}"></canvas>
            </div>
        </div>
    `;
}

/**
 * 만족도 점수 표시 (텍스트만, 그래프 없음)
 */
function createSatisfactionContent(question) {
    const distributionHtml = question.distribution ? 
        Object.entries(question.distribution).map(([point, count]) => `
            <div class="score-item">
                <div class="score-point">${point}</div>
                <div class="score-count">${count}명</div>
            </div>
        `).join('') : '';

    return `
        <div class="satisfaction-score">
            <div class="score-display">${question.score}/10</div>
            <div class="score-label">평균 만족도</div>
            ${distributionHtml ? `
                <div class="score-distribution">
                    ${distributionHtml}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 서술형 콘텐츠 생성
 */
function createNarrativeContent(question) {
    let content = '';
    
    if (question.data.positive) {
        content += `
            <div class="narrative-section">
                <h4 class="narrative-title">👍 긍정적 의견</h4>
                ${question.data.positive.map(response => `
                    <div class="quote-card">
                        <p class="quote-text">${response}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (question.data.improvement) {
        content += `
            <div class="narrative-section">
                <h4 class="narrative-title">⚠️ 개선이 필요한 점</h4>
                ${question.data.improvement.map(response => `
                    <div class="quote-card">
                        <p class="quote-text">${response}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (question.data.responses) {
        content = `
            <div class="narrative-section">
                <h4 class="narrative-title">💭 응답 내용</h4>
                ${question.data.responses.map(response => `
                    <div class="quote-card">
                        <p class="quote-text">${response}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `<div class="narrative-grid">${content}</div>`;
}

/**
 * 종합 요약 생성
 */
function createSummary() {
    const container = document.getElementById('summaryContent');
    const summary = surveyData.summary || {};
    
    container.innerHTML = `
        <div class="summary-card">
            <h4>🌟 핵심 강점</h4>
            <ul class="summary-list">
                ${(summary.strengths || []).map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="summary-card">
            <h4>💡 개선 과제</h4>
            <ul class="summary-list">
                ${(summary.improvements || []).map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

/**
 * 섹션 토글 기능
 */
function toggleSection(sectionId) {
    const questionNumber = sectionId.replace('question', '');
    const content = document.getElementById(`content${questionNumber}`);
    const chevron = document.getElementById(`chevron${questionNumber}`);
    
    if (!content || !chevron) return;
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        chevron.classList.remove('rotated');
    } else {
        content.classList.add('active');
        chevron.classList.add('rotated');
        
        // 차트가 있는 섹션이면 차트 그리기
        if (questionNumber && !isNaN(questionNumber)) {
            setTimeout(() => createChart(parseInt(questionNumber)), 100);
        }
    }
}

/**
 * 막대그래프 차트 생성 (문항 1, 2, 8, 9만)
 */
function createChart(questionNumber) {
    const question = surveyData.questions[questionNumber - 1];
    if (!question || question.type !== 'choice' || charts[`chart${questionNumber}`]) return;
    
    const ctx = document.getElementById(`chart${questionNumber}`);
    if (!ctx) return;
    
    // 막대그래프 설정
    const chartConfig = {
        type: 'bar',
        data: {
            labels: question.data.map(item => {
                // 긴 텍스트를 줄바꿈 처리
                const text = item.reason;
                if (text.length > 15) {
                    const words = text.split(' ');
                    if (words.length > 1) {
                        const mid = Math.ceil(words.length / 2);
                        return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                    } else {
                        return [text.substring(0, 15), text.substring(15)];
                    }
                }
                return text;
            }),
            datasets: [{
                data: question.data.map(item => item.percentage),
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return question.data[index].reason;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const item = question.data[index];
                            return `${item.percentage}% (${item.count || Math.round(item.percentage * 35 / 100)}명)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        color: 'white',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' }
                },
                x: {
                    ticks: { 
                        color: 'white', 
                        maxRotation: 45,
                        font: {
                            size: 11
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' }
                }
            }
        }
    };
    
    charts[`chart${questionNumber}`] = new Chart(ctx, chartConfig);
}

/**
 * 에러 표시
 */
function showError(message) {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = `
        <div class="section-card">
            <div style="padding: 3rem; text-align: center; color: rgba(255,255,255,0.8);">
                <h3 style="margin-bottom: 1rem;">⚠️ 오류 발생</h3>
                <p>${message}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">
                    브라우저 콘솔을 확인해보세요.
                </p>
            </div>
        </div>
    `;
}