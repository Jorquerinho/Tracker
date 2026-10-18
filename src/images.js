export function badgeThumbnail(image){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const scale=Math.min(128/image.width,128/image.height),w=Math.round(image.width*scale),h=Math.round(image.height*scale);
  canvas.getContext('2d').drawImage(image,0,0,image.width,image.height,Math.floor((128-w)/2),Math.floor((128-h)/2),w,h);
  return canvas.toDataURL('image/png');
}
