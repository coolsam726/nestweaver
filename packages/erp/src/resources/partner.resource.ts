import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  EmailField,
  IdColumn,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  TextareaField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class PartnerResourceBase extends Resource {
  static override slug = 'partners';
  static override label = 'Partners';
  static override singularLabel = 'Partner';
  static override icon = 'users';
  static override navigationGroup = 'Master data';
  static override navigationSection = 'Commercial';
  static override navigationSort = 10;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        EmailField.make('email').searchable(),
        TextField.make('phone'),
        SelectField.make('partnerType')
          .label('Type')
          .options([
            { label: 'Customer', value: 'customer' },
            { label: 'Vendor', value: 'vendor' },
            { label: 'Customer & vendor', value: 'both' },
          ]),
        BooleanField.make('isCompany').label('Is a company').inline(),
        BooleanField.make('active').label('Active').inline(),
        TextField.make('vat').label('Tax ID'),
        TextareaField.make('street').label('Street').columnSpanFull(),
        TextField.make('city'),
        TextField.make('country'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('email').searchable(),
        TextColumn.make('partnerType').label('Type').sortable(),
        BooleanColumn.make('active').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Identity')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('email'),
        TextColumn.make('phone'),
        TextColumn.make('partnerType').label('Type'),
        BooleanColumn.make('isCompany').label('Is a company'),
        TextColumn.make('vat').label('Tax ID'),
        TextColumn.make('street'),
        TextColumn.make('city'),
        TextColumn.make('country'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
