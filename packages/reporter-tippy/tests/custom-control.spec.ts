import matchers from '@testing-library/jest-dom/matchers';
import { expect, describe, test, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { Instance, Props } from 'tippy.js';
import { createForm, createDOM, cleanupDOM } from './common';
import { screen, waitFor } from '@testing-library/dom';
import reporter from '../src';

expect.extend(matchers);

function getTippy(element: any): Instance<Props> | undefined {
  return element?._tippy;
}

type ContentEditableProps = {
  name?: string;
  id?: string;
};

function createContentEditableInput(props: ContentEditableProps = {}) {
  const div = document.createElement('div');
  div.contentEditable = 'true';
  div.setAttribute('tabindex', '0');
  if (props.name) div.dataset.felteReporterTippyFor = props.name;
  if (props.id) div.id = props.id;
  return div;
}

describe('Reporter Tippy Custom Control', () => {
  beforeEach(createDOM);
  afterEach(cleanupDOM);

  test('sets aria-invalid to input and removes if valid', async () => {
    type Data = {
      test: string;
      deep: {
        value: string;
      };
    };
    const mockErrors = { test: 'An error', deep: { value: 'Deep error' } };
    const mockValidate = vi.fn(() => mockErrors);
    const { form, validate } = createForm<Data>({
      initialValues: {
        test: '',
        deep: {
          value: '',
        },
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter(),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
    });
    const valueElement = createContentEditableInput({
      name: 'deep.value',
    });
    const fieldsetElement = document.createElement('fieldset');
    fieldsetElement.appendChild(valueElement);
    formElement.appendChild(inputElement);
    formElement.appendChild(fieldsetElement);

    form(formElement);

    await validate();

    await waitFor(() => {
      const inputInstance = getTippy(inputElement);
      expect(inputInstance?.popper).toHaveTextContent(mockErrors.test);
      expect(inputElement).toBeInvalid();
      const valueInstance = getTippy(valueElement);
      expect(valueInstance).to.be.ok;
      expect(valueInstance?.popper).toHaveTextContent(mockErrors.deep.value);
      expect(valueElement).toBeInvalid();
    });

    mockValidate.mockImplementation(() => ({} as any));

    await validate();

    await waitFor(() => {
      expect(inputElement).not.toBeInvalid();
      expect(valueElement).not.toBeInvalid();
    });
  });

  test('show tippy on hover and hide on unhover', async () => {
    const mockErrors = { test: 'A test error' };
    const mockValidate = vi.fn(() => mockErrors);
    const { form, validate } = createForm({
      initialValues: {
        test: '',
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter(),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
    });
    formElement.appendChild(inputElement);

    const { destroy } = form(formElement);

    await validate();

    expect(getTippy(inputElement)).to.be.ok;

    userEvent.hover(inputElement);

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
      expect(tippyInstance?.popper).toHaveTextContent(mockErrors.test);
    });

    userEvent.unhover(inputElement);

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.not.be.ok;
    });

    mockValidate.mockImplementation(() => ({} as any));

    await validate();

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.not.be.ok;
      expect(tippyInstance?.state.isVisible).to.not.be.ok;
    });

    destroy();
  });

  test('shows tippy if active element is input', async () => {
    const mockErrors = { test: 'An error' };
    const mockValidate = vi.fn(() => mockErrors);
    const { form, validate } = createForm({
      initialValues: {
        test: '',
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter(),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
      id: 'test',
    });
    formElement.appendChild(inputElement);

    inputElement.focus();

    form(formElement);

    await validate();

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
      expect(tippyInstance?.popper).toHaveTextContent(mockErrors.test);
    });
  });

  test('focuses first invalid input and shows tippy on submit', async () => {
    type Data = {
      test: string;
      deep: {
        value: string;
      };
    };
    const mockErrors = { test: 'An error', deep: { value: 'Deep error' } };
    const mockValidate = vi.fn(() => mockErrors);
    const { form } = createForm<Data>({
      initialValues: {
        test: '',
        deep: {
          value: '',
        },
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter(),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
    });
    const valueElement = createContentEditableInput({
      name: 'deep.value',
    });
    const fieldsetElement = document.createElement('fieldset');
    fieldsetElement.appendChild(valueElement);
    formElement.appendChild(fieldsetElement);
    formElement.appendChild(inputElement);

    form(formElement);

    formElement.submit();

    await waitFor(() => {
      expect(valueElement).toHaveFocus();
      let tippyInstance = getTippy(valueElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
      expect(tippyInstance?.popper).toHaveTextContent(mockErrors.deep.value);
      tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.popper).toHaveTextContent(mockErrors.test);
    });
  });

  test('sets custom content', async () => {
    const mockErrors = { test: 'An error' };
    const mockValidate = vi.fn(() => mockErrors);
    const { form, validate } = createForm({
      initialValues: {
        test: '',
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter({
        setContent: (messages) => {
          return messages?.map((message) => `<p>${message}</p>`).join('');
        },
      }),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
      id: 'test',
    });
    formElement.appendChild(inputElement);

    inputElement.focus();

    form(formElement);

    await validate();

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
      expect(tippyInstance?.popper).toHaveTextContent(
        `<p>${mockErrors.test}</p>`
      );
    });
  });

  test('sets custom props per field', async () => {
    const mockErrors = { test: 'An error' };
    const mockValidate = vi.fn(() => mockErrors);
    type TestData = {
      test: string;
    };
    const { form, validate } = createForm<TestData>({
      initialValues: {
        test: '',
      },
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter<TestData>({
        tippyPropsMap: {
          test: {
            hideOnClick: false,
          },
        },
      }),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
      id: 'test',
    });
    formElement.appendChild(inputElement);

    inputElement.focus();

    form(formElement);

    await validate();

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
    });

    userEvent.click(formElement);
    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance?.state.isEnabled).to.be.ok;
      expect(tippyInstance?.state.isVisible).to.be.ok;
    });
  });

  test('handles mutation of DOM', async () => {
    const mockErrors = { test: 'An error' };
    const mockValidate = vi.fn(() => mockErrors);
    type TestData = {
      test: string;
    };
    const { form } = createForm<TestData>({
      onSubmit: vi.fn(),
      validate: mockValidate,
      extend: reporter<TestData>({
        tippyPropsMap: {
          test: {
            hideOnClick: false,
          },
        },
      }),
    });

    const formElement = screen.getByRole('form') as HTMLFormElement;
    const inputElement = createContentEditableInput({
      name: 'test',
      id: 'test',
    });

    expect(getTippy(inputElement)).to.not.be.ok;

    form(formElement);

    formElement.appendChild(inputElement);

    await waitFor(() => {
      const tippyInstance = getTippy(inputElement);
      expect(tippyInstance).to.be.ok;
    });
  });
});
