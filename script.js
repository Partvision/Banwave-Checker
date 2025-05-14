import confetti from 'confetti';

const STORAGE_KEY_USER_SUBMISSION_STATUS_PREFIX = 'robloxBanwaveUserSubmission_Status_';
const STORAGE_KEY_USER_SUBMISSION_WEEK_YEAR = 'robloxBanwaveUserLastSubmittedWeekYear';
const STORAGE_KEY_WEEKLY_REPORT_PREFIX = 'robloxBanwaveWeeklyReport_';

function getCurrentWeekInfo() {
    let d = new Date();
    let date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return { week: weekNo, year: date.getUTCFullYear() };
}

function loadWeeklyReportData(week, year) {
    const reportKey = `${STORAGE_KEY_WEEKLY_REPORT_PREFIX}${year}_${week}`;
    const data = localStorage.getItem(reportKey);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing weekly report data:", e);
        }
    }
    return { no: 0, friend: 0, self: 0, total: 0 };
}

function saveWeeklyReportData(week, year, data) {
    const reportKey = `${STORAGE_KEY_WEEKLY_REPORT_PREFIX}${year}_${week}`;
    localStorage.setItem(reportKey, JSON.stringify(data));
}

function displayResults() {
    const { week, year } = getCurrentWeekInfo();
    const reportData = loadWeeklyReportData(week, year);

    let percentNo = 0;
    let percentFriend = 0;
    let percentSelf = 0;

    if (reportData.total > 0) {
        percentNo = Math.round((reportData.no / reportData.total) * 100);
        percentFriend = Math.round((reportData.friend / reportData.total) * 100);
        percentSelf = Math.round((reportData.self / reportData.total) * 100);
        
        let sum = percentNo + percentFriend + percentSelf;
        if (sum !== 100 && sum > 0) { 
            if (sum !== 100) {
                let diff = 100 - sum;
                if (reportData.no > 0 && (reportData.no >= reportData.friend || reportData.friend === 0) && (reportData.no >= reportData.self || reportData.self === 0)) {
                    percentNo += diff;
                } else if (reportData.friend > 0 && (reportData.friend >= reportData.no || reportData.no === 0) && (reportData.friend >= reportData.self || reportData.self === 0)) {
                    percentFriend += diff;
                } else if (reportData.self > 0) {
                    percentSelf += diff;
                } else { 
                   percentNo += diff;
                }
            }
        }
        percentNo = Math.max(0, percentNo);
        percentFriend = Math.max(0, percentFriend);
        percentSelf = Math.max(0, percentSelf);

        let finalSum = percentNo + percentFriend + percentSelf;
        if (finalSum !== 100 && reportData.total > 0) {
             if (percentNo >= percentFriend && percentNo >= percentSelf) {
                percentNo = 100 - percentFriend - percentSelf;
            } else if (percentFriend >= percentNo && percentFriend >= percentSelf) {
                percentFriend = 100 - percentNo - percentSelf;
            } else {
                percentSelf = 100 - percentNo - percentFriend;
            }
        }
    }

    document.getElementById('result-no').textContent = `${percentNo}%`;
    document.getElementById('result-friend').textContent = `${percentFriend}%`;
    document.getElementById('result-self').textContent = `${percentSelf}%`;
    document.getElementById('total-votes').textContent = `Total votes this week: ${reportData.total}`;
    document.getElementById('report-week').textContent = `Report for Week ${week} of ${year}`;
}

function handleSubmission(event) {
    event.preventDefault();

    const form = event.target;
    const selectedStatus = form.elements['ban-status'].value;

    const { week, year } = getCurrentWeekInfo();
    const currentWeekYearString = `${week}_${year}`;

    let weeklyData = loadWeeklyReportData(week, year);
    if (selectedStatus === 'no') weeklyData.no++;
    else if (selectedStatus === 'friend-banned') weeklyData.friend++;
    else if (selectedStatus === 'self-banned') weeklyData.self++;
    weeklyData.total++;
    saveWeeklyReportData(week, year, weeklyData);

    localStorage.setItem(STORAGE_KEY_USER_SUBMISSION_WEEK_YEAR, currentWeekYearString);
    const userSubmissionStatusKey = `${STORAGE_KEY_USER_SUBMISSION_STATUS_PREFIX}${currentWeekYearString}`;
    localStorage.setItem(userSubmissionStatusKey, selectedStatus);

    showUserSubmissionStatus(selectedStatus);
    disableForm();
    displayResults();

    confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A0D2EB', '#B0E0E6', '#88C0D0', '#E6F3F7', '#4A90E2']
    });
}

function showUserSubmissionStatus(statusKey) {
    const statusElement = document.getElementById('submission-status');
    statusElement.classList.add('submitted');
    let statusText = 'Thank you for your report!';
    switch (statusKey) {
        case 'no':
            statusText = 'Thank you for your report! Status: No issues reported.';
            break;
        case 'friend-banned':
            statusText = 'Thank you for your report! Status: Friend banned reported.';
            break;
        case 'self-banned':
            statusText = 'Thank you for your report! Status: Self banned reported.';
            break;
    }
    statusElement.textContent = statusText;
}

function disableForm() {
    const form = document.getElementById('banwave-survey');
    const inputs = form.elements;
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = true;
    }
    document.getElementById('submit-button').disabled = true;
    document.getElementById('submission-status').classList.add('submitted');
}

function checkSubmissionStatus() {
    const { week, year } = getCurrentWeekInfo();
    const currentWeekYearString = `${week}_${year}`;
    const lastSubmittedWeekYear = localStorage.getItem(STORAGE_KEY_USER_SUBMISSION_WEEK_YEAR);

    if (lastSubmittedWeekYear === currentWeekYearString) {
        const userSubmissionStatusKey = `${STORAGE_KEY_USER_SUBMISSION_STATUS_PREFIX}${currentWeekYearString}`;
        const lastSubmissionStatus = localStorage.getItem(userSubmissionStatusKey);
        if (lastSubmissionStatus) {
            showUserSubmissionStatus(lastSubmissionStatus);
        } else {
            showUserSubmissionStatus('unknown'); 
        }
        disableForm();
    } else {
        document.getElementById('submission-status').textContent = 'Please submit your status for this week.';
        document.getElementById('submission-status').classList.remove('submitted');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayResults(); 
    checkSubmissionStatus(); 

    const surveyForm = document.getElementById('banwave-survey');
    if (surveyForm) {
        surveyForm.addEventListener('submit', handleSubmission);
    }
});