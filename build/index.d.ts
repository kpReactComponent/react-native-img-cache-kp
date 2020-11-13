import { PureComponent } from "react";
import { ImageProperties, ImageURISource } from "react-native";
export declare type CacheHandler = (path: string, loading: boolean, isFail: boolean) => void;
export interface CachedImageURISource extends ImageURISource {
    uri: string;
}
export declare class ImageCache {
    private getPath;
    private static instance;
    private constructor();
    static get(): ImageCache;
    static cacheDir(): string;
    private cache;
    clear(): any;
    on(source: CachedImageURISource, handler: CacheHandler, immutable?: boolean): void;
    dispose(uri: string, handler: CacheHandler): void;
    bust(uri: string): void;
    cancel(uri: string): void;
    private download;
    private get;
    private notify;
}
export interface CachedImageProps extends ImageProperties {
    mutable?: boolean;
    onImageLoadStart?: (path?: string) => void;
    onImageLoadEnd?: (path?: string) => void;
    onImageError: (path?: string) => void;
}
export interface CustomCachedImageProps extends CachedImageProps {
    component: new () => PureComponent<any, any>;
}
export interface CachedImageState {
    path: string | undefined;
}
export declare abstract class BaseCachedImage<P extends CachedImageProps> extends PureComponent<P, CachedImageState> {
    state: {
        path: undefined;
    };
    private uri;
    private handler;
    private dispose;
    private observe;
    protected getProps(): any;
    private checkSource;
    componentDidMount(): void;
    componentDidUpdate(prevProps: P, prevState: CachedImageState): void;
    componentWillUnmount(): void;
}
export declare class CachedImage extends BaseCachedImage<CachedImageProps> {
    render(): JSX.Element;
}
export declare class CachedImageBackground extends BaseCachedImage<CachedImageProps> {
    render(): JSX.Element;
}
export declare class CustomCachedImage<P extends CustomCachedImageProps> extends BaseCachedImage<P> {
    render(): JSX.Element;
}
