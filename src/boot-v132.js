/* Historical split-entry compatibility markers only:
import './boot-v128.js?v=132base1'
from './release-manifest.js'
runtime.coordinator.registerRelease({ id:RELEASE.version
runtime:RELEASE.runtimeLabel
cacheBust:RELEASE.cacheBust
centralizedReleaseManifest:true
centralizedVersionAssertions:true
activeBootImportsV131:false
activeBootImportsV130:false
activeBootImportsV129:false
startupLight:true
*/
export * from './release-manifest.js';
