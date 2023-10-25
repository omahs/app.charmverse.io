import type { ParsedUrlQuery } from 'querystring';

import { addQueryToUrl } from 'lib/utilities/url';

import { getCustomDomainFromHost } from './getCustomDomainFromHost';
import { getSpaceDomainFromHost } from './getSpaceDomainFromHost';

// Given a hostname, space domain, and path, return a path that can be used to open a page.
export function getPagePath({
  hostName,
  spaceDomain,
  path,
  query
}: {
  hostName?: string;
  spaceDomain: string;
  path: string;
  query?: ParsedUrlQuery;
}) {
  const isDomainInPath = !getCustomDomainFromHost(hostName) && !getSpaceDomainFromHost(hostName);
  const pathWithDomain = `/${isDomainInPath ? `${spaceDomain}/` : ''}${path}`;
  const { pathname, search } = addQueryToUrl({
    url: pathWithDomain,
    query
  });
  const pathWithQuery = `${pathname}${search}`;
  return encodeURI(pathWithQuery);
}
