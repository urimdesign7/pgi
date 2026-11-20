/// <reference types="google.maps" />
import { useEffect, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';
import { MISSION_META } from '../data/pgiData';

declare const __GOOGLE_MAPS_KEY_FALLBACK__: string | undefined;

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (typeof __GOOGLE_MAPS_KEY_FALLBACK__ !== 'undefined' ? __GOOGLE_MAPS_KEY_FALLBACK__ : '') ||
  '';

interface ResolvedPlaceData {
  id: string;
  displayName: string;
  formattedAddress: string;
  position: google.maps.LatLngLiteral;
  attributions: Array<{ provider: string | null; providerURI: string | null }>;
}

let cachedMissionPlace: ResolvedPlaceData | null = null;

function isQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
      ? JSON.stringify(error)
      : String(error);
  return (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('OVER_QUERY_LIMIT') ||
    message.includes('429')
  );
}

function MissionMapInner() {
  const loadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlaceData | null>(cachedMissionPlace);
  const [lookupError, setLookupError] = useState(false);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (
      loadingStatus === APILoadingStatus.AUTH_FAILURE ||
      loadingStatus === APILoadingStatus.FAILED
    ) {
      setLookupError(true);
    }
  }, [loadingStatus]);

  useEffect(() => {
    if (cachedMissionPlace || !placesLib) return;

    let cancelled = false;

    const resolveCenterPlace = async () => {
      try {
        const queries = [
          '경기도 수원시 권선구 동수원로 25번길 55 빛과소금교회',
          '경기도 수원시 권선구 동수원로 25번길 55',
        ];

        let matchedPlace: google.maps.places.Place | null = null;

        for (const textQuery of queries) {
          const { places } = await placesLib.Place.searchByText({
            textQuery,
            fields: ['id', 'displayName', 'formattedAddress', 'location'],
            language: 'ko',
            region: 'kr',
            maxResultCount: 1,
          });
          if (places.length > 0 && places[0].location) {
            matchedPlace = places[0];
            break;
          }
        }

        if (cancelled) return;

        if (!matchedPlace || !matchedPlace.location) {
          setLookupError(true);
          return;
        }

        const data: ResolvedPlaceData = {
          id: matchedPlace.id,
          displayName: matchedPlace.displayName || '수원 빛과소금교회 (PGI 선교회 센터)',
          formattedAddress: matchedPlace.formattedAddress || MISSION_META.address,
          position: {
            lat: matchedPlace.location.lat(),
            lng: matchedPlace.location.lng(),
          },
          attributions: (matchedPlace.attributions ?? []).map((attr) => ({
            provider: attr.provider ?? null,
            providerURI: attr.providerURI ?? null,
          })),
        };

        cachedMissionPlace = data;
        setResolvedPlace(data);
        setLookupError(false);
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setLookupError(true);
      }
    };

    void resolveCenterPlace();

    return () => {
      cancelled = true;
    };
  }, [placesLib]);

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    resolvedPlace?.formattedAddress || MISSION_META.address
  )}`;

  if (
    lookupError ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE ||
    loadingStatus === APILoadingStatus.FAILED
  ) {
    return (
      <div className="w-full h-[240px] sm:h-[260px] rounded-lg border border-stone-200 bg-[#EBE6DF]/60 flex flex-col items-center justify-center p-5 text-center gap-3">
        <MapPin className="w-6 h-6 text-[#9A6B22]" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#1C1917]">수원 빛과소금교회 2층 본당</p>
          <p className="text-xs text-[#57534E]">{MISSION_META.address}</p>
        </div>
        <a
          href={externalMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9A6B22] bg-[#FBF9F5] border border-stone-300 rounded-md hover:border-[#9A6B22] transition-colors"
        >
          <span>Google 지도에서 위치 보기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  if (!resolvedPlace) {
    return (
      <div
        className="w-full h-[240px] sm:h-[260px] rounded-lg border border-stone-200 bg-[#EBE6DF]/70 flex items-center justify-center text-xs text-[#78716C]"
        aria-live="polite"
      >
        지도를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="w-full h-[240px] sm:h-[260px] rounded-lg overflow-hidden border border-stone-200 bg-[#EBE6DF]">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={resolvedPlace.position}
          defaultZoom={16}
          gestureHandling="cooperative"
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            ref={markerRef}
            position={resolvedPlace.position}
            title={resolvedPlace.displayName}
            onClick={() => setInfoWindowOpen((prev) => !prev)}
          >
            <Pin background="#9A6B22" borderColor="#744E15" glyphColor="#FBF9F5" />
          </AdvancedMarker>

          {infoWindowOpen && marker && (
            <InfoWindow
              anchor={marker}
              maxWidth={240}
              onCloseClick={() => setInfoWindowOpen(false)}
            >
              <div className="text-xs space-y-1 pr-1 text-[#1C1917]">
                <p className="font-semibold">{resolvedPlace.displayName}</p>
                <p className="text-[#57534E] leading-snug">{resolvedPlace.formattedAddress}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {resolvedPlace.attributions.length > 0 && (
        <p className="text-[11px] text-[#78716C] flex flex-wrap gap-x-2 gap-y-0.5">
          {resolvedPlace.attributions.map((attr, idx) =>
            attr.provider ? (
              attr.providerURI ? (
                <a
                  key={`${attr.provider}-${idx}`}
                  href={attr.providerURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#1C1917]"
                >
                  {attr.provider}
                </a>
              ) : (
                <span key={`${attr.provider}-${idx}`}>{attr.provider}</span>
              )
            ) : null
          )}
        </p>
      )}
    </div>
  );
}

export function MissionLocationMap() {
  if (!MAPS_API_KEY) {
    return (
      <div className="w-full h-[240px] sm:h-[260px] rounded-lg border border-stone-200 bg-[#EBE6DF]/60 flex flex-col items-center justify-center p-5 text-center gap-3">
        <MapPin className="w-6 h-6 text-[#9A6B22]" />
        <p className="text-xs text-[#57534E]">{MISSION_META.address}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            MISSION_META.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9A6B22] bg-[#FBF9F5] border border-stone-300 rounded-md hover:border-[#9A6B22] transition-colors"
        >
          <span>Google 지도에서 위치 보기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY} language="ko" region="KR" libraries={['places', 'marker']}>
      <MissionMapInner />
    </APIProvider>
  );
}
