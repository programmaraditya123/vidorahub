import React from 'react';
import FastImage, { type FastImageProps, type ResizeMode } from 'react-native-fast-image';

type ContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

type ImageProps = Omit<FastImageProps, 'resizeMode'> & {
  contentFit?: ContentFit;
  cachePolicy?: string;
  recyclingKey?: string;
  transition?: number;
  resizeMode?: ResizeMode;
};

function toResizeMode(contentFit?: ContentFit, resizeMode?: ResizeMode): ResizeMode {
  if (resizeMode) return resizeMode;

  switch (contentFit) {
    case 'contain':
    case 'scale-down':
      return FastImage.resizeMode.contain;
    case 'fill':
      return FastImage.resizeMode.stretch;
    case 'none':
      return FastImage.resizeMode.center;
    case 'cover':
    default:
      return FastImage.resizeMode.cover;
  }
}

export function Image({
  contentFit,
  resizeMode,
  cachePolicy: _cachePolicy,
  recyclingKey: _recyclingKey,
  transition: _transition,
  ...props
}: ImageProps) {
  return <FastImage {...props} resizeMode={toResizeMode(contentFit, resizeMode)} />;
}
