// RN-SVG port of the web's app/components/Icons.tsx. Only the icons
// the currently-ported screens use — add more as screens come over.

import Svg, { Circle, Path, type SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; filled?: boolean };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
});

export function HeartIcon({ size = 24, filled, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CommentIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M21 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.5A8 8 0 1 1 21 12Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RemixIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M3 7h11a5 5 0 0 1 5 5v1"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 4l3 3-3 3"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 17H10a5 5 0 0 1-5-5v-1"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 20l-3-3 3-3"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6l-4-4-4 4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2v14"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HomeIcon({ size = 24, filled, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Circle
        cx={11}
        cy={11}
        r={7}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="m20 20-3.5-3.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function InboxIcon({ size = 24, filled, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M22 12h-6l-2 3h-4l-2-3H2"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-6l3.5-7z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserIcon({ size = 24, filled, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Circle
        cx={12}
        cy={8}
        r={4}
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M4 21a8 8 0 0 1 16 0"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DotsIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Circle cx={5} cy={12} r={2} fill={color} />
      <Circle cx={12} cy={12} r={2} fill={color} />
      <Circle cx={19} cy={12} r={2} fill={color} />
    </Svg>
  );
}

export function XIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SparkIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2Z"
        fill={color}
      />
      <Path
        d="M19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6L19 14Z"
        fill={color}
      />
    </Svg>
  );
}

export function TrashIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 11v6M14 11v6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FlagIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M4 21V4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M4 4h11l-2 4 2 4H4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HideIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.71 6.71A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 4.7-1.3M2 2l20 20"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Circle
        cx={12}
        cy={12}
        r={3}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LinkIcon({ size = 24, color = "#fff", ...p }: Props) {
  return (
    <Svg {...base(size)} {...p}>
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
