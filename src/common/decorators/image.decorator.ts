import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidImage(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEitherInternalOrExternal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as any; 
          console.log(dto);
                   
          
          const hasFilename = dto.avatar.filename !== undefined && dto.avatar.filename !== null;
          const hasUrl = dto.avatar.url !== undefined && dto.avatar.url !== null;
          
          return (hasFilename && !hasUrl) || (!hasFilename && hasUrl);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Image must have either internal data (filename, mimeType, size) OR external data (url), not both or none';
        },
      },
    });
  };
}