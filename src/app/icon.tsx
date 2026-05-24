import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b4501e",
          borderRadius: 8,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3c2.3 0 4 2 4 4.6 0 1-.3 1.9-.8 2.7 1.4.7 2.4 2.1 2.6 3.8M12 3c-2.3 0-4 2-4 4.6 0 1 .3 1.9.8 2.7-1.4.7-2.4 2.1-2.6 3.8M12 3V1.4M12 21c-3.2 0-5.6-2.6-5.6-6 0-1.3.4-2.5 1-3.4M12 21c3.2 0 5.6-2.6 5.6-6 0-1.3-.4-2.5-1-3.4M12 21v1.6M6.4 9 3.3 7.2M17.6 9l3.1-1.8M5.6 15l-3 .9M18.4 15l3 .9M12 9.5v6" />
        </svg>
      </div>
    ),
    size,
  );
}
