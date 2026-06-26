import { fontFamilyBangla, fontFamilySans } from '@razzak-machinaries/shared/ui';
import type { ReactDiffViewerStylesOverride } from 'react-diff-viewer-continued';

export function getFieldDiffStyles(isBangla: boolean): ReactDiffViewerStylesOverride {
  const fontFamily = isBangla ? fontFamilyBangla : fontFamilySans;

  return {
    variables: {
      light: {
        diffViewerBackground: '#fff',
        diffViewerColor: 'hsl(215 32% 10%)',
        diffViewerTitleBackground: 'hsl(40 18% 95%)',
        diffViewerTitleColor: 'hsl(215 12% 40%)',
        diffViewerTitleBorderColor: 'hsl(38 16% 86%)',
        addedBackground: '#e6ffed',
        addedColor: '#24292e',
        removedBackground: '#ffeef0',
        removedColor: '#24292e',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#ffdce0',
        gutterBackground: 'hsl(40 18% 95%)',
        gutterColor: 'hsl(215 12% 40%)',
        codeFoldBackground: '#f1f8ff',
        codeFoldGutterBackground: '#dbedff',
        emptyLineBackground: 'hsl(40 22% 98%)',
      },
    },
    diffContainer: {
      borderRadius: '0.375rem',
      border: '1px solid hsl(38 16% 86%)',
      fontSize: '0.8125rem',
      fontFamily,
    },
    contentText: {
      fontFamily,
    },
    line: {
      '&:hover': {
        background: 'hsl(40 18% 95%)',
      },
    },
    titleBlock: {
      fontFamily: fontFamilySans,
      fontSize: '0.75rem',
      fontWeight: 600,
    },
  };
}
