import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        // 토큰과 사용자 정보를 localStorage에 저장
        localStorage.setItem('token', token);
        localStorage.setItem('user', userParam);

        toast.success('로그인 성공!');
        navigate('/dashboard');
      } catch (error) {
        console.error('인증 콜백 처리 중 오류:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    } else {
      // 에러 파라미터 확인
      const error = searchParams.get('error');
      if (error) {
        toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      } else {
        toast.error('인증 정보를 받을 수 없습니다.');
      }
      navigate('/login');
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

