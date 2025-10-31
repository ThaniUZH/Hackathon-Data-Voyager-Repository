import { useEffect, useState } from "react";

type BackgroundState = "idle" | "thinking" | "success";

interface AnimatedBackgroundProps {
  state: BackgroundState;
}

export default function AnimatedBackground({ state }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAnimationSpeed = () => {
    switch (state) {
      case "thinking":
        return "15s";
      case "success":
        return "25s";
      case "idle":
      default:
        return "30s";
    }
  };

  const getOpacity = () => {
    switch (state) {
      case "thinking":
        return "0.15";
      case "success":
        return "0.08";
      case "idle":
      default:
        return "0.05";
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        style={{
          opacity: getOpacity(),
          background: `
            radial-gradient(circle at 20% 50%, hsl(198, 100%, 43%) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, hsl(198, 100%, 55%) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, hsl(198, 80%, 35%) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, hsl(198, 90%, 45%) 0%, transparent 50%)
          `,
          animation: `float ${getAnimationSpeed()} ease-in-out infinite`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: getOpacity(),
          background: `
            radial-gradient(circle at 60% 70%, hsl(198, 100%, 50%) 0%, transparent 50%),
            radial-gradient(circle at 10% 30%, hsl(198, 85%, 40%) 0%, transparent 50%)
          `,
          animation: `float ${getAnimationSpeed()} ease-in-out infinite reverse`,
        }}
      />
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}
