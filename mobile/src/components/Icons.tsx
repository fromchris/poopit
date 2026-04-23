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
