import {
  CURRENT_RELEASE,
  CURRENT_RELEASE_TITLE,
  roadmapStatus,
  roadmapStatusLabel,
  validateCurrentReleaseManifest
} from '../../src/release-manifest.js';

validateCurrentReleaseManifest();

export const currentRelease = CURRENT_RELEASE;
export const currentVersion = CURRENT_RELEASE.version;
export const currentReleaseNumber = CURRENT_RELEASE.number;
export const currentReleaseName = CURRENT_RELEASE.name;
export const currentPackageVersion = CURRENT_RELEASE.packageVersion;
export const currentTitle = CURRENT_RELEASE_TITLE;
export const currentBootSpecifier = CURRENT_RELEASE.bootSpecifier;
export const currentBootResourcePattern = new RegExp(`/${CURRENT_RELEASE.bootPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${CURRENT_RELEASE.assets.shell}$`);
export const currentRoadmapStatus = roadmapStatus(CURRENT_RELEASE.version);
export const currentRoadmapLabel = roadmapStatusLabel(currentRoadmapStatus);
export const shippedRoadmapCount = CURRENT_RELEASE.number - CURRENT_RELEASE.roadmapStart;
export const directionalRoadmapCount = CURRENT_RELEASE.roadmapEnd - CURRENT_RELEASE.number;

export function expectedRoadmapStatus(version) {
  return roadmapStatus(version);
}

export function expectedRoadmapLabel(version) {
  return roadmapStatusLabel(roadmapStatus(version));
}
