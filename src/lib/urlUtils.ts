export const getPageParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('page');
};

export const getSessionId = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('session_id');
};

export const setPageParam = (page: string): void => {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.history.pushState({}, '', url);
};

export const clearPageParam = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete('page');
  url.searchParams.delete('session_id');
  window.history.pushState({}, '', url);
};

export const isSubscriptionSuccessPage = (): boolean => {
  return getPageParam() === 'subscription-success';
};
