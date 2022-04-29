import '@bangle.dev/tooltip/style.css';
import '@skiff-org/prosemirror-tables/style/tables.css';
import '@skiff-org/prosemirror-tables/style/table-popup.css';
import '@skiff-org/prosemirror-tables/style/table-headers.css';
import '@skiff-org/prosemirror-tables/style/table-filters.css';
import 'prosemirror-menu/style/menu.css';
import 'theme/prosemirror-tables/prosemirror-tables.scss';
import createCache from '@emotion/cache';
import { CacheProvider, Global } from '@emotion/react'; // create a cache so we dont conflict with emotion from react-windowed-select
import type { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import { Web3Provider } from '@ethersproject/providers';
// fullcalendar css
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
// init focalboard
import '@mattermost/compass-icons/css/compass-icons.css';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Web3ReactProvider } from '@web3-react/core';
import log from 'lib/log';
import { LitProtocolProvider } from 'adapters/litProtocol/hooks/useLitProtocol';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import RouteGuard from 'components/common/RouteGuard';
import 'components/common/BoardEditor/focalboard/src/components/blockIconSelector.scss';
import 'components/common/BoardEditor/focalboard/src/components/calculations/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/calendar/fullcalendar.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardBadges.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetail.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/comment.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDialog.scss';
import 'components/common/BoardEditor/focalboard/src/components/centerPanel.scss';
import 'components/common/BoardEditor/focalboard/src/components/confirmationDialogBox.scss';
import 'components/common/BoardEditor/focalboard/src/components/content/checkboxElement.scss';
import 'components/common/BoardEditor/focalboard/src/components/content/dividerElement.scss';
import 'components/common/BoardEditor/focalboard/src/components/contentBlock.scss';
import 'components/common/BoardEditor/focalboard/src/components/dialog.scss';
import { FlashMessages } from 'components/common/BoardEditor/focalboard/src/components/flashMessages';
import 'components/common/BoardEditor/focalboard/src/components/flashMessages.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/gallery.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/galleryCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/globalHeader/globalHeader.scss';
import 'components/common/BoardEditor/focalboard/src/components/globalHeader/globalHeaderSettingsMenu.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculationOption.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanban.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanColumn.scss';
import 'components/common/BoardEditor/focalboard/src/components/markdownEditor.scss';
import 'components/common/BoardEditor/focalboard/src/components/markdownEditorInput/entryComponent/entryComponent.scss';
import 'components/common/BoardEditor/focalboard/src/components/markdownEditorInput/markdownEditorInput.scss';
import 'components/common/BoardEditor/focalboard/src/components/modal.scss';
import 'components/common/BoardEditor/focalboard/src/components/modalWrapper.scss';
import 'components/common/BoardEditor/focalboard/src/components/newVersionBanner.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/createdAt/createdAt.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/dateRange/dateRange.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/lastModifiedAt/lastModifiedAt.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/lastModifiedBy/lastModifiedBy.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/link/link.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/user/user.scss';
import 'components/common/BoardEditor/focalboard/src/components/shareBoardComponent.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/deleteBoardDialog.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/registrationLink.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebar.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebarAddBoardMenu.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebarBoardItem.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebarSettingsMenu.scss';
// import 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebarUserMenu.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/calculation/calculationRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/horizontalGrip.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/table.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/tableRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/topBar.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewHeader/filterComponent.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewHeader/filterEntry.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeader.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewTitle.scss';
import { getMessages } from 'components/common/BoardEditor/focalboard/src/i18n';
import store from 'components/common/BoardEditor/focalboard/src/store';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { fetchLanguage, getLanguage } from 'components/common/BoardEditor/focalboard/src/store/language';
// import 'components/common/BoardEditor/focalboard/src/styles/main.scss';
import 'components/common/BoardEditor/focalboard/src/styles/labels.scss';
import 'components/common/BoardEditor/focalboard/src/styles/variables.scss';
import 'components/common/BoardEditor/focalboard/src/styles/_markdown.scss';
import { setTheme as setFocalBoardTheme } from 'components/common/BoardEditor/focalboard/src/theme';
// import 'components/common/BoardEditor/focalboard/src/widgets/buttons/button.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/buttons/buttonWithMenu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/buttons/iconButton.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/editable.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/editableArea.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/editableDayPicker.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/add.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/board.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/calendar.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/card.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/check.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/close.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/delete.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/disclosureTriangle.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/divider.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/dot.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/dropdown.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/duplicate.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/edit.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/emoji.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/focalboard_logo.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/gallery.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/grip.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/hamburger.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/help.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/hide.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/hideSidebar.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/image.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/link.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/logo.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/logoWithName.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/logoWithNameWhite.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/options.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/settings.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/show.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/showSidebar.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/sortDown.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/sortUp.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/submenuTriangle.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/table.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/icons/text.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/label.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/colorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/labelOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/menu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/separatorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/subMenuOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menuWrapper.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/switch.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/tooltip.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/valueSelector.scss';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { Web3ConnectionManager } from 'components/_app/Web3ConnectionManager';
import { ColorModeContext } from 'context/darkMode';
import { BountiesProvider } from 'hooks/useBounties';
import { PaymentMethodsProvider } from 'hooks/usePaymentMethods';
import { FocalboardViewsProvider } from 'hooks/useFocalboardViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { PagesProvider } from 'hooks/usePages';
import { ThreadsProvider } from 'hooks/useThreads';
import { ContributorsProvider } from 'hooks/useContributors';
import { PageTitleProvider, TitleContext } from 'hooks/usePageTitle';
import { SpacesProvider } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';
import { isMobile } from 'lib/browser';
// Lit Protocol CSS
import 'lit-share-modal/dist/style.css';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { IntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import 'react-resizable/css/styles.css';
import { createThemeLightSensitive } from 'theme';
import 'theme/@bangle.dev/styles.scss';
import 'theme/focalboard/focalboard.button.scss';
import 'theme/focalboard/focalboard.main.scss';
import 'theme/focalboard/focalboard.typography.scss';
import {
  darkTheme,
  lightTheme
} from 'theme/focalboard/theme';
import { setDarkMode } from 'theme/darkMode';
import cssVariables from 'theme/cssVariables';
import 'theme/lit-share-modal/lit-share-modal.scss';
import { setTheme as setLitProtocolTheme } from 'theme/lit-share-modal/theme';
import 'theme/styles.scss';
import Snackbar from 'components/common/Snackbar';
import { SnackbarProvider } from 'hooks/useSnackbar';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';

const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc) => new Web3Provider(provider);

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => ReactElement
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App ({ Component, pageProps }: AppPropsWithLayout) {

  const getLayout = Component.getLayout ?? (page => page);
  const router = useRouter();

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles?.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  // dark mode: https://mui.com/customization/dark-mode/
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<PaletteMode | null>('darkMode', null);
  const [mode, setMode] = useState<PaletteMode>('light');
  const colorModeContext = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode: PaletteMode) => {
        const newMode = prevMode === 'light' ? 'dark' : 'light';
        return newMode;
      });
    }
  }), []);

  // Update the theme only if the mode changes
  const theme = useMemo(() => {
    const muiTheme = createThemeLightSensitive(mode);

    if (typeof window !== 'undefined') {
      setFocalBoardTheme(mode === 'dark' ? darkTheme : lightTheme);
      setSavedDarkMode(mode);
      setLitProtocolTheme(mode, muiTheme);
      setDarkMode(mode === 'dark');
    }
    return muiTheme;
  }, [mode]);

  useEffect(() => {
    if (savedDarkMode) {
      setMode(savedDarkMode);
    }
    else if (prefersDarkMode) {
      setMode('dark');
    }
  }, [prefersDarkMode, savedDarkMode]);

  // wait for router to be ready, as we rely on the URL to know what space to load

  if (!router.isReady) {
    return null;
  }

  // DO NOT REMOVE CacheProvider - it protects MUI from Tailwind CSS in settings
  return (
    <CacheProvider value={createCache({ key: 'app' })}>
      <ColorModeContext.Provider value={colorModeContext}>
        <ThemeProvider theme={theme}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Web3ConnectionManager>
              <LitProtocolProvider>
                <ReduxProvider store={store}>
                  <FocalBoardProviders>
                    <DataProviders>
                      <SnackbarProvider>
                        <TitleContext.Consumer>
                          {([title]) => (
                            <Head>
                              <title>
                                {title ? `${title} | CharmVerse` : 'CharmVerse - the all-in-one web3 workspace'}
                              </title>
                              {/* viewport meta tag goes in _app.tsx - https://nextjs.org/docs/messages/no-document-viewport-meta */}
                              <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
                            </Head>
                          )}
                        </TitleContext.Consumer>
                        <CssBaseline enableColorScheme={true} />
                        <Global styles={cssVariables} />
                        <RouteGuard>
                          <ErrorBoundary>
                            {getLayout(<Component {...pageProps} />)}
                            <Snackbar />
                          </ErrorBoundary>
                        </RouteGuard>
                      </SnackbarProvider>
                    </DataProviders>
                  </FocalBoardProviders>
                  {/** include the root portal for focalboard's popup */}
                  <FocalBoardPortal />
                </ReduxProvider>
              </LitProtocolProvider>
            </Web3ConnectionManager>
          </Web3ReactProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </CacheProvider>
  );
}

function FocalBoardProviders ({ children }: { children: ReactNode }) {

  const language = useAppSelector<string>(getLanguage);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLanguage());
  }, []);

  return (
    <IntlProvider
      locale={language.split(/[_]/)[0]}
      messages={getMessages(language)}
    >
      <DndProvider backend={isMobile() ? TouchBackend : HTML5Backend}>
        <FlashMessages milliseconds={2000} />
        {children}
      </DndProvider>
    </IntlProvider>
  );
}

function DataProviders ({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    log.debug('Load focalboard data');
    if (router.query.domain) {
      dispatch(initialLoad());
    }
  }, [router.query.domain]);

  return (
    <UserProvider>
      <SpacesProvider>
        <ContributorsProvider>
          <BountiesProvider>
            <PaymentMethodsProvider>
              <PagesProvider>
                <PageTitleProvider>
                  <ThreadsProvider>
                    <FocalboardViewsProvider>
                      {children}
                    </FocalboardViewsProvider>
                  </ThreadsProvider>
                </PageTitleProvider>
              </PagesProvider>
            </PaymentMethodsProvider>
          </BountiesProvider>
        </ContributorsProvider>
      </SpacesProvider>
    </UserProvider>
  );
}
