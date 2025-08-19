export class ObjectValidationsUtils {
  isDefinedObject(object: any){
    return object !== undefined && object !== null;
  }

  hasDatabaseForbiddenObject(_id: any, __v: any) {
    return this.isDefinedObject(_id) || this.isDefinedObject(__v);
  }
}