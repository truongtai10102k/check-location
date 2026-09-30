import { useCallback, useEffect, useRef, useState } from "react";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const ERROR_MESSAGES = {
  1: [
    "Bạn chưa cấp quyền vị trí",
    "Hãy cho phép Location trong phần quyền của trang trên Chrome rồi thử lại.",
  ],
  2: [
    "Không xác định được vị trí",
    "Thiết bị hoặc dịch vụ định vị hiện không cung cấp được dữ liệu.",
  ],
  3: [
    "Yêu cầu đã hết thời gian",
    "Việc lấy vị trí mất quá lâu. Hãy kiểm tra kết nối rồi thử lại.",
  ],
};

function toError(error) {
  const [title, detail] = ERROR_MESSAGES[error.code] ?? [
    "Có lỗi xảy ra",
    error.message || "Chrome không thể lấy vị trí hiện tại.",
  ];
  return { title, detail };
}

function checkSupport() {
  if (!window.isSecureContext) {
    return {
      title: "Trang không ở secure context",
      detail: "Hãy mở trang bằng HTTPS hoặc địa chỉ localhost.",
    };
  }
  if (!("geolocation" in navigator)) {
    return {
      title: "Trình duyệt không hỗ trợ",
      detail: "Geolocation API không có trên trình duyệt này.",
    };
  }
  return null;
}

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [permission, setPermission] = useState("unknown");
  const watchIdRef = useRef(null);

  // Theo dõi trạng thái quyền (granted / denied / prompt) nếu Chrome hỗ trợ.
  useEffect(() => {
    let status;
    const onChange = () => setPermission(status.state);

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        status = result;
        setPermission(result.state);
        result.addEventListener("change", onChange);
      })
      .catch(() => {});

    return () => status?.removeEventListener("change", onChange);
  }, []);

  const onSuccess = useCallback((pos) => {
    setPosition(pos);
    setError(null);
    setLoading(false);
  }, []);

  const onError = useCallback((err) => {
    setError(toError(err));
    setLoading(false);
  }, []);

  const getCurrent = useCallback(() => {
    const unsupported = checkSupport();
    if (unsupported) return setError(unsupported);

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, GEO_OPTIONS);
  }, [onSuccess, onError]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }, []);

  const startWatch = useCallback(() => {
    const unsupported = checkSupport();
    if (unsupported) return setError(unsupported);

    stopWatch();
    setLoading(true);
    setError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      GEO_OPTIONS,
    );
    setWatching(true);
  }, [onSuccess, onError, stopWatch]);

  useEffect(() => stopWatch, [stopWatch]);

  return {
    position,
    error,
    loading,
    watching,
    permission,
    getCurrent,
    startWatch,
    stopWatch,
  };
}
