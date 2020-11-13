import React, { PureComponent } from "react";
import { Image, ImageBackground, Platform } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
const SHA1 = require("crypto-js/sha1");
const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
const BASE_DIR = RNFetchBlob.fs.dirs.CacheDir + "/react-native-img-cache";
const FILE_PREFIX = Platform.OS === "ios" ? "" : "file://";
const TEMP_EXT = "temp"; // 临时文件后缀
const TRY_COUNT = 3; // 重试3次
export class ImageCache {
    constructor() {
        this.cache = {};
    }
    getPath(uri, immutable, temp) {
        let path = uri.substring(uri.lastIndexOf("/"));
        path = path.indexOf("?") === -1 ? path : path.substring(path.lastIndexOf("."), path.indexOf("?"));
        const ext = path.indexOf(".") === -1 ? ".jpg" : path.substring(path.indexOf("."));
        const tempExt = temp ? TEMP_EXT : "";
        if (immutable === true) {
            return BASE_DIR + "/" + SHA1(uri) + tempExt + ext;
        }
        else {
            return BASE_DIR + "/" + s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4() + tempExt + ext;
        }
    }
    static get() {
        if (!ImageCache.instance) {
            ImageCache.instance = new ImageCache();
        }
        return ImageCache.instance;
    }
    // 缓存位置
    static cacheDir() {
        return BASE_DIR;
    }
    clear() {
        this.cache = {};
        return RNFetchBlob.fs.unlink(BASE_DIR);
    }
    on(source, handler, immutable) {
        const { uri } = source;
        if (!this.cache[uri]) {
            this.cache[uri] = {
                source,
                downloading: false,
                handlers: [handler],
                immutable: immutable === true,
                path: immutable === true ? this.getPath(uri, immutable) : undefined,
                tryCount: 0,
            };
        }
        else {
            this.cache[uri].handlers.push(handler);
        }
        this.get(uri);
    }
    dispose(uri, handler) {
        const cache = this.cache[uri];
        if (cache) {
            cache.handlers.forEach((h, index) => {
                if (h === handler) {
                    cache.handlers.splice(index, 1);
                }
            });
        }
    }
    bust(uri) {
        const cache = this.cache[uri];
        if (cache !== undefined && !cache.immutable) {
            cache.path = undefined;
            this.get(uri);
        }
    }
    cancel(uri) {
        const cache = this.cache[uri];
        if (cache && cache.downloading) {
            cache.task.cancel();
        }
    }
    download(cache) {
        const { source } = cache;
        const { uri } = source;
        if (!cache.downloading && cache.tryCount < TRY_COUNT) {
            // 下载的临时文件地址
            const path = this.getPath(uri, cache.immutable, true);
            // 下载后的正式文件地址
            const destPath = this.getPath(uri, cache.immutable, false);
            cache.downloading = true;
            const method = source.method ? source.method : "GET";
            cache.task = RNFetchBlob.config({ path }).fetch(method, uri, source.headers);
            this.notify(uri, true, false);
            cache.task.then((res) => {
                if (res.info().status == 200) {
                    // 下载成功后，重命名临时文件
                    return RNFetchBlob.fs.mv(path, destPath);
                }
                else {
                    // 合并下载失败的处理逻辑 cache
                    // cache.downloading = false;
                    // // Parts of the image may have been downloaded already, (see https://github.com/wkh237/react-native-fetch-blob/issues/331)
                    // RNFetchBlob.fs.unlink(path);
                    // this.notify(uri, false, true);
                    return Promise.reject();
                }
            }).then(() => {
                cache.downloading = false;
                cache.path = destPath;
                this.notify(uri, false, false);
            }).catch(() => {
                cache.downloading = false;
                cache.tryCount += 1;
                // Parts of the image may have been downloaded already, (see https://github.com/wkh237/react-native-fetch-blob/issues/331)
                RNFetchBlob.fs.unlink(path);
                this.notify(uri, false, true);
            });
        }
    }
    get(uri) {
        const cache = this.cache[uri];
        if (cache.path) {
            // We check here if IOS didn't delete the cache content
            RNFetchBlob.fs.exists(cache.path).then((exists) => {
                if (exists) {
                    this.notify(uri, false, false);
                }
                else {
                    this.download(cache);
                }
            });
        }
        else {
            this.download(cache);
        }
    }
    notify(uri, loading, isFail) {
        const handlers = this.cache[uri].handlers;
        handlers.forEach(handler => {
            handler(this.cache[uri].path, loading, isFail);
        });
    }
}
export class BaseCachedImage extends PureComponent {
    constructor() {
        super(...arguments);
        this.state = { path: undefined };
        this.handler = (path, loading, isFail) => {
            if (loading && this.props.onImageLoadStart) {
                this.props.onImageLoadStart(path);
                return;
            }
            if (isFail && this.props.onImageError) {
                this.props.onImageError(path);
                return;
            }
            if (!loading && !isFail) {
                if (this.props.onImageLoadEnd)
                    this.props.onImageLoadEnd(path);
                this.setState({ path });
                return;
            }
        };
    }
    dispose() {
        if (this.uri) {
            ImageCache.get().dispose(this.uri, this.handler);
        }
    }
    observe(source, mutable) {
        if (source.uri !== this.uri) {
            this.dispose();
            this.uri = source.uri;
            ImageCache.get().on(source, this.handler, !mutable);
        }
    }
    getProps() {
        const props = {};
        Object.keys(this.props).forEach(prop => {
            if (prop === "source" && this.props.source.uri) {
                props["source"] = this.state.path ? { uri: FILE_PREFIX + this.state.path } : {};
            }
            else if (["mutable", "component"].indexOf(prop) === -1) {
                props[prop] = this.props[prop];
            }
        });
        return props;
    }
    checkSource(source) {
        if (Array.isArray(source)) {
            throw new Error(`Giving multiple URIs to CachedImage is not yet supported.
            If you want to see this feature supported, please file and issue at
             https://github.com/wcandillon/react-native-img-cache`);
        }
        return source;
    }
    componentDidMount() {
        const { mutable } = this.props;
        const source = this.checkSource(this.props.source);
        this.setState({ path: undefined });
        if (typeof (source) !== "number" && source.uri) {
            this.observe(source, mutable === true);
        }
    }
    componentDidUpdate(prevProps, prevState) {
        const { mutable } = this.props;
        const source = this.checkSource(this.props.source);
        if (typeof (source) !== "number" && source.uri) {
            this.observe(source, mutable === true);
        }
    }
    componentWillUnmount() {
        this.dispose();
    }
}
export class CachedImage extends BaseCachedImage {
    render() {
        const props = this.getProps();
        if (React.Children.count(this.props.children) > 0) {
            console.warn("Using <CachedImage> with children is deprecated, use <CachedImageBackground> instead.");
        }
        return React.createElement(Image, Object.assign({}, props), this.props.children);
    }
}
export class CachedImageBackground extends BaseCachedImage {
    render() {
        const props = this.getProps();
        return React.createElement(ImageBackground, Object.assign({}, props), this.props.children);
    }
}
export class CustomCachedImage extends BaseCachedImage {
    render() {
        const { component } = this.props;
        const props = this.getProps();
        const Component = component;
        return React.createElement(Component, Object.assign({}, props), this.props.children);
    }
}
//# sourceMappingURL=index.js.map