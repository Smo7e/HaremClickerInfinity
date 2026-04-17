// src/hooks/useDevice.ts
import { useState, useEffect, useCallback } from "react";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouch: boolean;
  isYaGames: boolean;
  width: number;
  height: number;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPortrait: true,
    isLandscape: false,
    isTouch: false,
    isYaGames: false,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateDeviceInfo = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Проверка Yandex Games iframe
    const isYaGames = (() => {
      try {
        return window.self !== window.top && !!window.YaGames;
      } catch {
        return false;
      }
    })();

    setDeviceInfo({
      isMobile: width < 768 && isTouch,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024 || !isTouch,
      isPortrait: height > width,
      isLandscape: width > height,
      isTouch,
      isYaGames,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    updateDeviceInfo();

    const handleResize = () => {
      updateDeviceInfo();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

// Утилита для CSS-классов
export function getDeviceClasses(deviceInfo: DeviceInfo): string {
  const classes = [];
  if (deviceInfo.isMobile) classes.push("device-mobile");
  if (deviceInfo.isTablet) classes.push("device-tablet");
  if (deviceInfo.isDesktop) classes.push("device-desktop");
  if (deviceInfo.isPortrait) classes.push("orientation-portrait");
  if (deviceInfo.isLandscape) classes.push("orientation-landscape");
  if (deviceInfo.isTouch) classes.push("device-touch");
  if (deviceInfo.isYaGames) classes.push("yandex-iframe");
  return classes.join(" ");
}
