import { useGeolocation } from "./useGeolocation.js";

const PERMISSION_LABELS = {
  granted: "Đã cho phép",
  denied: "Đã chặn",
  prompt: "Chưa hỏi",
  unknown: "Không rõ",
};

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function getStatus({ error, loading, position, watching }) {
  if (error) return { state: "error", ...error };
  if (loading) {
    return {
      state: "loading",
      title: "Đang yêu cầu vị trí",
      detail: "Nếu Chrome hỏi quyền, hãy chọn Cho phép (Allow).",
    };
  }
  if (position) {
    return {
      state: "success",
      title: watching ? "Đang theo dõi vị trí" : "Đã lấy được vị trí",
      detail: watching
        ? "Tọa độ sẽ tự cập nhật khi thiết bị di chuyển."
        : "Chrome đã trả về tọa độ hiện tại của thiết bị.",
    };
  }
  return {
    state: "loading",
    title: "Đang chờ...",
    detail: "Bấm nút bên dưới để Chrome xin quyền truy cập vị trí.",
  };
}

function mapEmbedUrl(lat, lng) {
  const d = 0.005;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function App() {
  const geo = useGeolocation();
  const { position, loading, watching, permission } = geo;
  const status = getStatus(geo);
  const coords = position?.coords;

  const metrics = [
    ["Vĩ độ", coords?.latitude.toFixed(6)],
    ["Kinh độ", coords?.longitude.toFixed(6)],
    ["Độ chính xác", coords && `± ${Math.round(coords.accuracy)} m`],
    ["Cập nhật lúc", position && timeFormatter.format(position.timestamp)],
  ];

  return (
    <main>
      <h1>Vị trí hiện tại</h1>
      <p className="intro">
        Demo đọc vị trí từ Chrome bằng Geolocation API. Dữ liệu chỉ hiển thị
        trong trình duyệt và không được gửi đi đâu.
      </p>

      <section className="status" data-state={status.state} aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <span>
          <strong className="status-title">{status.title}</strong>
          <span className="status-detail">{status.detail}</span>
        </span>
      </section>

      <p className="permission">
        Quyền vị trí: <strong>{PERMISSION_LABELS[permission]}</strong>
      </p>

      <dl>
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      {coords && (
        <iframe
          className="map"
          title="Bản đồ vị trí hiện tại"
          src={mapEmbedUrl(coords.latitude, coords.longitude)}
        />
      )}

      <div className="actions">
        <button type="button" onClick={geo.getCurrent} disabled={loading}>
          {loading
            ? "Đang lấy vị trí..."
            : position
              ? "Lấy lại vị trí"
              : "Lấy vị trí hiện tại"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={watching ? geo.stopWatch : geo.startWatch}
        >
          {watching ? "Dừng theo dõi" : "Theo dõi liên tục"}
        </button>
        {coords && (
          <a
            className="link"
            href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Mở Google Maps
          </a>
        )}
      </div>

      <p className="note">
        Chrome chỉ cho phép truy cập vị trí trên HTTPS hoặc localhost. Độ chính
        xác phụ thuộc GPS, Wi-Fi, mạng và thiết bị đang dùng.
      </p>
    </main>
  );
}
