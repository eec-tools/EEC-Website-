// Small form building blocks shared by the two public enquiry forms.
import React from "react";

const inputClass =
  "mt-2 w-full bg-[#FFFFFF] border px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70";

const borderFor = (error) => (error ? "border-[#B42318]" : "hairline");

export function FormSection({ title, children }) {
  return (
    <fieldset className="border-t hairline pt-8 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div className="text-xs uppercase tracking-[0.14em] text-[#012D76] font-semibold mb-5" aria-hidden="true">
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </fieldset>
  );
}

export function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-[#B42318]" role="alert">
      {error}
    </p>
  );
}

function Label({ htmlFor, label, required, optional }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#012D76]">
      {label}
      {required && <span className="text-[#B42318]"> *</span>}
      {optional && <span className="font-normal text-[#6B7280]"> (optional)</span>}
    </label>
  );
}

export function TextField({ name, label, value, onChange, error, required, optional, type = "text", hint, autoComplete, full, placeholder, inputMode }) {
  const id = `f-${name}`;
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label htmlFor={id} label={label} required={required} optional={optional} />
      {hint && <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${borderFor(error)}`}
        data-testid={`field-${name}`}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function TextAreaField({ name, label, value, onChange, error, required, optional, hint, rows = 4, placeholder }) {
  const id = `f-${name}`;
  return (
    <div className="md:col-span-2">
      <Label htmlFor={id} label={label} required={required} optional={optional} />
      {hint && <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>}
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${borderFor(error)}`}
        data-testid={`field-${name}`}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function SelectField({ name, label, value, onChange, error, required, options, placeholder = "Select" }) {
  const id = `f-${name}`;
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${borderFor(error)}`}
        data-testid={`field-${name}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

// options: [{ value, label, sub? }]
export function RadioCards({ name, label, value, onChange, error, required, options, columns = 1 }) {
  const id = `f-${name}`;
  const cols = columns === 3 ? "lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <div className="md:col-span-2" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined} id={id}>
      <div id={`${id}-label`} className="block text-sm font-medium text-[#012D76]">
        {label}
        {required && <span className="text-[#B42318]"> *</span>}
      </div>
      <div className={`mt-2 grid grid-cols-1 ${cols} gap-3`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer gap-3 border p-4 transition-colors ${
                checked ? "border-[#012D76] bg-[#012D76]/[0.04]" : error ? "border-[#B42318]" : "hairline bg-white hover:border-[#012D76]/40"
              }`}
              data-testid={`option-${name}-${o.value}`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(name, o.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#012D76]"
              />
              <span>
                <span className="block text-sm font-medium text-[#012D76]">{o.label}</span>
                {o.sub && <span className="block text-xs text-[#6B7280] mt-0.5">{o.sub}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function ConsentCheckbox({ name, checked, onChange, error, children }) {
  const id = `f-${name}`;
  return (
    <div className="md:col-span-2">
      <label htmlFor={id} className={`flex gap-3 border p-4 cursor-pointer ${error ? "border-[#B42318]" : "hairline"} bg-white`}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-[#012D76]"
          data-testid={`field-${name}`}
        />
        <span className="text-sm text-[#3A4759] leading-relaxed">
          {children}
          <span className="text-[#B42318]"> *</span>
        </span>
      </label>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

// Hidden spam trap. People never see it; the backend ignores submissions that fill it.
export function HoneypotField({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label htmlFor="f-fax_number">Fax number</label>
      <input id="f-fax_number" name="fax_number" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange("fax_number", e.target.value)} />
    </div>
  );
}

// Moves focus to the first field with an error after a failed submit.
export function focusFirstError(errors, order) {
  const first = order.find((k) => errors[k]);
  if (!first) return;
  const el = document.getElementById(`f-${first}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = el.matches("input,select,textarea") ? el : el.querySelector("input");
  focusable?.focus({ preventScroll: true });
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
