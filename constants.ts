
import { PageBlock } from './types';

export const INITIAL_BLOCKS: PageBlock[] = [
  {
    id: 'initial-container',
    type: 'container',
    content: '',
    styles: {
      padding: '40px',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      width: '100%',
      minHeight: '200px'
    },
    children: [
      {
        id: 'initial-title',
        type: 'title',
        content: 'Welcome to Lumina Builder',
        styles: {
          fontSize: '36px',
          fontWeight: '700',
          color: '#1e293b',
          textAlign: 'center'
        }
      },
      {
        id: 'initial-text',
        type: 'text',
        content: 'Start building your amazing HTML template by adding blocks from the left sidebar.',
        styles: {
          fontSize: '18px',
          color: '#64748b',
          textAlign: 'center',
          width: '80%'
        }
      }
    ]
  }
];

export const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '40px', '48px', '64px'];
export const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800'];
export const TEXT_ALIGNS = ['left', 'center', 'right'];
export const BACKGROUND_SIZES = ['cover', 'contain', 'auto'];
export const OBJECT_FITS = ['cover', 'contain', 'fill', 'none'];
