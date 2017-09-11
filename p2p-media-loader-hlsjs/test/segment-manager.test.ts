import * as sinon from "sinon";
import { mock, instance, verify, deepEqual, when, anyFunction } from "ts-mockito";

import SegmentManager from "../lib/segment-manager";
import {LoaderEvents, Segment, LoaderInterface} from "p2p-media-loader-core";

class LoaderInterfaceEmptyImpl implements LoaderInterface {
    on(eventName: string | symbol, listener: Function): this { return this; }
    load(segments: Segment[], playlistUrl: string, emitNowSegmentUrl?: string): void { }
    getSettings(): any { }
    destroy(): void { }
}

const testPlaylist = {
    url: "http://site.com/stream/playlist.m3u8",
    baseUrl: "http://site.com/stream/",
    content: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXTINF:5
segment-1041.ts
#EXTINF:5.055
segment-1042.ts
#EXTINF:6.125
segment-1043.ts
#EXTINF:5.555
segment-1044.ts
#EXTINF:5.555
segment-1045.ts
#EXTINF:5.115
segment-1046.ts
#EXTINF:5.425
segment-1047.ts
#EXTINF:5.745
segment-1048.ts
`
};

describe("SegmentManager", () => {

    it("should call onSuccess after segment loading succeeded", () => {
        const loader = mock<LoaderInterface>(LoaderInterfaceEmptyImpl);

        const onSuccess = sinon.spy();
        let segmentLoadedListener: Function = () => { throw new Error("SegmentLoaded listener not set"); };
        when(loader.on(LoaderEvents.SegmentLoaded, anyFunction())).thenCall((eventName_unused, listener) => {
            segmentLoadedListener = listener;
        });

        const segment = new Segment(testPlaylist.baseUrl + "segment-1045.ts");
        segment.data = new ArrayBuffer(0);

        const manager = new SegmentManager(instance(loader));
        manager.processPlaylist(testPlaylist.url, "manifest", testPlaylist.content);
        manager.loadSegment(segment.url, onSuccess);
        segmentLoadedListener(segment);

        onSuccess.calledWith(segment.data);
    });

    it("should call onError after segment loading failed", () => {
        const loader = mock<LoaderInterface>(LoaderInterfaceEmptyImpl);

        const onError = sinon.spy();
        let segmentErrorListener: Function = () => { throw new Error("SegmentError listener not set"); };
        when(loader.on(LoaderEvents.SegmentError, anyFunction())).thenCall((eventName_unused, listener) => {
            segmentErrorListener = listener;
        });

        const url = testPlaylist.baseUrl + "segment-1045.ts";
        const error = "Test error message content";

        const manager = new SegmentManager(instance(loader));
        manager.processPlaylist(testPlaylist.url, "manifest", testPlaylist.content);
        manager.loadSegment(url, undefined, onError);
        segmentErrorListener(url, error);

        onError.calledWith(error);
    });

    it("should not call onSuccess nor onError after abortSegment call", () => {
        const loader = mock<LoaderInterface>(LoaderInterfaceEmptyImpl);

        const onSuccess = sinon.spy();
        let segmentLoadedListener: Function = () => { throw new Error("SegmentLoaded listener not set"); };
        when(loader.on(LoaderEvents.SegmentLoaded, anyFunction())).thenCall((eventName_unused, listener) => {
            segmentLoadedListener = listener;
        });

        const onError = sinon.spy();
        let segmentErrorListener: Function = () => { throw new Error("SegmentError listener not set"); };
        when(loader.on(LoaderEvents.SegmentError, anyFunction())).thenCall((eventName_unused, listener) => {
            segmentErrorListener = listener;
        });

        const segment = new Segment(testPlaylist.baseUrl + "segment-1045.ts");
        segment.data = new ArrayBuffer(0);

        const manager = new SegmentManager(instance(loader));
        manager.processPlaylist(testPlaylist.url, "manifest", testPlaylist.content);
        manager.loadSegment(segment.url, onSuccess, onError);
        manager.abortSegment(segment.url);
        segmentLoadedListener(segment);

        sinon.assert.notCalled(onSuccess);
        sinon.assert.notCalled(onError);
    });

});