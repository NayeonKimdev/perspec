import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const hasVerified = useRef(false); // 이미 인증 시도했는지 추적

  useEffect(() => {
    // 이미 인증을 시도했거나 처리 중이면 실행하지 않음
    if (hasVerified.current || status !== 'verifying') {
      return;
    }

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('인증 토큰이 없습니다.');
        setIsLoading(false);
        return;
      }

      // 인증 시도 표시
      hasVerified.current = true;

      try {
        const response = await axios.get('/api/auth/verify-email', {
          params: { token }
        });

        setStatus('success');
        setMessage(response.data.message || '이메일 인증이 완료되었습니다.');
        toast.success('이메일 인증이 완료되었습니다!');
        
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        const errorMessage = error.response?.data?.message || '이메일 인증 중 오류가 발생했습니다.';
        setMessage(errorMessage);
        // 429 에러(Too Many Requests)는 한 번만 표시
        if (error.response?.status !== 429) {
          toast.error(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // token만 dependency로 유지

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            이메일 인증
          </h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          {isLoading ? (
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                이메일 인증을 처리하고 있습니다...
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                인증 완료
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                잠시 후 로그인 페이지로 이동합니다...
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                인증 실패
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  로그인 페이지로 이동
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

