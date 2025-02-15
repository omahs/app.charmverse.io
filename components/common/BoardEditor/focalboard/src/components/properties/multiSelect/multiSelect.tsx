import React, { useState } from 'react';

import type { IPropertyOption, IPropertyTemplate } from '../../../blocks/board';
import Label from '../../../widgets/label';
import ValueSelector from '../../../widgets/valueSelector';

type Props = {
  emptyValue: string;
  propertyTemplate: IPropertyTemplate;
  propertyValue: string | string[];
  onChange: (value: string | string[]) => void;
  onChangeColor?: (option: IPropertyOption, color: string) => void;
  onDeleteOption?: (option: IPropertyOption) => void;
  onCreate?: (newValue: string, currentValues: IPropertyOption[]) => void;
  onDeleteValue?: (valueToDelete: IPropertyOption, currentValues: IPropertyOption[]) => void;
  isEditable: boolean;
};

function MultiSelectProperty(props: Props): JSX.Element {
  const {
    propertyTemplate,
    emptyValue,
    propertyValue,
    isEditable,
    onChange,
    onChangeColor,
    onDeleteOption,
    onCreate,
    onDeleteValue
  } = props;
  const [open, setOpen] = useState(false);

  const values =
    Array.isArray(propertyValue) && propertyValue.length > 0
      ? propertyValue
          .map((v) => propertyTemplate.options.find((o) => o!.id === v))
          .filter((v): v is IPropertyOption => Boolean(v))
      : [];

  if (!isEditable || !open) {
    return (
      <div
        className='octo-propertyvalue'
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-testid='multiselect-non-editable'
        onClick={() => setOpen(true)}
      >
        {values.map((v) => (
          <Label key={v.id} color={v.color}>
            {v.value}
          </Label>
        ))}
        {values.length === 0 && <Label color='empty'>{emptyValue}</Label>}
      </div>
    );
  }

  return (
    <ValueSelector
      isMulti={true}
      emptyValue={emptyValue}
      options={propertyTemplate.options}
      value={values}
      onChange={onChange}
      onChangeColor={onChangeColor ?? (() => {})}
      onDeleteOption={onDeleteOption ?? (() => {})}
      onDeleteValue={(valueToRemove) => onDeleteValue && onDeleteValue(valueToRemove, values)}
      onCreate={(newValue) => onCreate && onCreate(newValue, values)}
      onBlur={() => setOpen(false)}
    />
  );
}

export default MultiSelectProperty;
