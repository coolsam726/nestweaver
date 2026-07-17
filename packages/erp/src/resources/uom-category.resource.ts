import {
  DateTimeColumn,
  IdColumn,
  Resource,
  Schema,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class UomCategoryResourceBase extends Resource {
  static override slug = 'uom-categories';
  static override label = 'UoM categories';
  static override singularLabel = 'UoM category';
  static override icon = 'layers';
  static override navigationGroup = 'Master data';
  static override navigationSection = 'Units';
  static override navigationSort = 30;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(1)
      .fields(TextField.make('name').required().searchable());
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Identity')
      .entries(TextColumn.make('name'), DateTimeColumn.make('createdAt'))
      .build();
  }
}
