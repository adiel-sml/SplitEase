const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export function generateAvatar(name: string): { avatar: string; color: string } {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  const colorIndex = name.length % COLORS.length;
  const color = COLORS[colorIndex];
  
  // Create SVG avatar
  const avatar = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${color}"/>
      <text x="20" y="28" text-anchor="middle" fill="white" font-family="sans-serif" font-size="14" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `)}`;
  
  return { avatar, color };
}