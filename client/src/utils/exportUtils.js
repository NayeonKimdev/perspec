/**
 * 데이터 내보내기 유틸리티 함수
 */

// CSV로 변환
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  // 헤더 처리
  const headerRow = headers ? headers.join(',') : Object.keys(data[0]).join(',');
  
  // 데이터 행 처리
  const rows = data.map(row => {
    return Object.values(row).map(value => {
      // 값이 객체나 배열인 경우 JSON 문자열로 변환
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // 쉼표나 따옴표가 포함된 경우 따옴표로 감싸기
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
};

// JSON으로 변환
export const convertToJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

// 파일 다운로드 헬퍼
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// CSV 다운로드
export const downloadCSV = (data, filename, headers = null) => {
  const csv = convertToCSV(data, headers);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

// JSON 다운로드
export const downloadJSON = (data, filename) => {
  const json = convertToJSON(data);
  downloadFile(json, `${filename}.json`, 'application/json');
};

export default {
  convertToCSV,
  convertToJSON,
  downloadFile,
  downloadCSV,
  downloadJSON
};














