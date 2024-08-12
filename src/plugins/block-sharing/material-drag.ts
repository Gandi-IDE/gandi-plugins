// 整理拖拽的数据源，以及传递到GUI。
// eslint-disable-next-line require-jsdoc
export default function materialDrag(data: any): void {
  const dragData = {
    ...data,
    ...(data.payload && {
      payload: {
        ...data.payload,
        bodyUrl: data.payload.uri,
        body: data.payload.uri.substring(data.payload.uri.lastIndexOf("/") + 1),
      },
    }),
  };
  return dragData;
}
