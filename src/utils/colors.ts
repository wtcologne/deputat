const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = Number.parseInt(sanitized, 16);

  if (Number.isNaN(bigint)) {
    return { r: 0, g: 0, b: 0 };
  }

  if (sanitized.length === 3) {
    return {
      r: ((bigint >> 8) & 0xf) * 17,
      g: ((bigint >> 4) & 0xf) * 17,
      b: (bigint & 0xf) * 17,
    };
  }

  return {
    r: (bigint >> 16) & 0xff,
    g: (bigint >> 8) & 0xff,
    b: bigint & 0xff,
  };
};

export const getReadableTextColor = (bgColor: string): 'black' | 'white' => {
  const { r, g, b } = hexToRgb(bgColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? 'black' : 'white';
};
