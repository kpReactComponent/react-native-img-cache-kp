# React Native Image Cache

因为expo的局限，无法自由的使用作者提供的[react-native-expo-image-cache](https://github.com/wcandillon/react-native-expo-image-cache)， 而原作者也不再更新该库，因此我们fork了一个版本来维护  
```
npm install react-native-img-cache-kp --save
```
---
## Release versions
  


### version 3.x.x
  
支持版本 RN >= 0.60.0
  
### version 2.0.2  
  
支持版本 RN <= 0.59.x   
  
原有的三方库[react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob)已经废弃，这里替换成新的库[rn-fetch-blob](https://github.com/joltup/rn-fetch-blob)  
  
如果使用了以前的版本，首先删除原有的依赖库  
```
react-native unlink react-native-fetch-blob
npm uninstall react-native-fetch-blob  
```  
集成新的依赖库  
```
npm install rn-fetch-blob
react-native link rn-fetch-blob  
```  
**iOS端使用了CocoaPods**，在Podfile中添加
```ruby
pod 'rn-fetch-blob', :path => '../node_modules/rn-fetch-blob'
```  
成功后执行
```
pod update
```

### version 1.6.4  
新增startLoad、endLoad、loadError状态回调  
```jsx
<CachedImage
  onImageLoadStart={() => {}}
  onImageLoadEnd={(path) => {}}
  onImageError={() => {}}
/>
```
---  
以下是原有的说明  

[![CircleCI](https://circleci.com/gh/wcandillon/react-native-img-cache.svg?style=svg)](https://circleci.com/gh/wcandillon/react-native-img-cache)
[![npm version](https://badge.fury.io/js/react-native-img-cache.svg)](https://badge.fury.io/js/react-native-img-cache)

CachedImage component and Cache image manager for React Native.

## Deprecated

**I am no longer maintaining this library but [react-native-expo-image-cache](https://github.com/wcandillon/react-native-expo-image-cache) which depends on ExpoKit.**

**Checkout [5 things to know about Images in React Native](https://medium.com/@wcandillon/5-things-to-know-about-images-react-native-69be41d2a9ee)**

## Why do I need this?
Starting version `0.43`, the React Native [Image component](https://facebook.github.io/react-native/docs/image.html) has now a cache property: `cache: force-cache` (iOS only). This is a major improvement but only for iOS and at this time, I wasn't able to use it in a way that provides a user experience as smooth as this module.

## Installation

### react-native-fetch-blob
This package has a dependency with [react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob).
If your project doesn't have a dependency with this package already, please refer to [their installation instructions](https://github.com/wkh237/react-native-fetch-blob#user-content-installation).

```bash
npm install react-native-img-cache --save
```

## Usage

### CachedImage

The `CachedImage` component assumes that the image URI will never change. The image is stored and served from the application cache. This component accepts the same properties than `Image` except for a few difference:
* `source` doesn't accept an array of image URIs like `Image` does. Please file an issue if that's something you would like to see supported.
* The `uri` property in `source` is mandatory.
* The `body` property in `source` is not supported. Please file an issue if that's something you would like to see supported.

```jsx
import {CachedImage} from "react-native-img-cache";

<CachedImage source={{ uri: "https://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg" }} />
```

The `mutable` property implies assumes that the image URI can change over time. The lifetime of this cache is the one of the running application and it can be manually busted using `ImageCache`.

```jsx
import {CachedImage} from "react-native-img-cache";

<CachedImage source={{ uri: "https://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg" }} mutable />
```

### Custom Image Component

By default, the `CachedImage` component is using the [standard RN Image component](https://facebook.github.io/react-native/docs/image.html).
It is possible however to use a different component via `CustomCachedImage`. In the example below, we use the `Image` component from [react-native-image-progress](https://github.com/oblador/react-native-image-progress).  
新增 `onLoadStart` `onLoadEnd` `onError` 监听方法
```jsx
import {CustomCachedImage} from "react-native-img-cache";

import Image from 'react-native-image-progress';
import ProgressBar from 'react-native-progress/Bar';

<CustomCachedImage
  component={Image}
  source={{ uri: 'http://loremflickr.com/640/480/dog' }} 
  indicator={ProgressBar} 
  style={{
    width: 320, 
    height: 240, 
  }}
  onLoadStart={()=>{}}
  onLoadEnd={()=>{}}
  onError={()=>{}}
/>
```

### ImageCache

#### clear()

Remove cache entries and all physical files.

```js
ImageCache.get().clear();
```

#### bust(uri)

`ImageCache` can be used to bust an image from the local cache.
This removes the cache entry but it **does not remove any physical files**.

```js
ImageCache.get().bust("https://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg");
```

#### cancel(uri)

It can also be used to cancel the download of an image. This can be very useful when [scrolling through images](https://medium.com/@wcandillon/image-pipeline-with-react-native-listview-b92d4768b17c).

```js
ImageCache.get().cancel("https://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg");
```

#### on(uri, observer, immutable)

The `ImageCache` class can register observers to the cache.

```js
const immutable = true;
const observer = (path: string) => {
    console.log(`path of the image in the cache: ${path}`);
};
ImageCache.get().on(uri, observer, immutable);
```

We use the observer pattern instead of a promise because a mutable image might have different version with different paths in the cache.

#### dispose(uri, observer)

Observers can be deregistered using `dispose`:

```js
ImageCache.get().dispose(uri, observer);
```

## Testing with jest

### Mocking CachedImage

With jest, testing a snapshot can generate errors. Jest doesn't know how to generate the component CachedImage. For fix this, you have to mock CachedImage with Image component.

```js
jest.mock('react-native-img-cache', () => {
  const mockComponent = require('react-native/jest/mockComponent')
  return {
    CustomCachedImage: mockComponent('Image'),
    CachedImage: mockComponent('Image'),
  }
})
```
