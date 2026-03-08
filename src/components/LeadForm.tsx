import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { leadFormSchema, LeadFormValues, ROOF_AGE_OPTIONS } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

export function LeadForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", address: "", zip_code: "", phone: "", email: "", roof_age: "", concerns: "" },
  });

  async function onSubmit(values: LeadFormValues) {
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: values.name,
      address: values.address,
      zip_code: values.zip_code,
      phone: values.phone,
      email: values.email,
      roof_age: values.roof_age,
      concerns: values.concerns || null,
    });
    setSubmitting(false);
    if (error) {
      form.setError("root", { message: "Something went wrong. Please try again." });
      return;
    }
    navigate("/thank-you");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address</FormLabel>
            <FormControl>
              <AddressAutocomplete
                value={field.value}
                onChange={field.onChange}
                onAddressSelect={(details) => {
                  if (details.street) field.onChange(details.street);
                  if (details.zip) form.setValue("zip_code", details.zip);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField control={form.control} name="zip_code" render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code</FormLabel>
              <FormControl><Input placeholder="12345" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="roof_age" render={({ field }) => (
            <FormItem>
              <FormLabel>Roof Age</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROOF_AGE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="concerns" render={({ field }) => (
          <FormItem>
            <FormLabel>Any concerns or details?</FormLabel>
            <FormControl><Textarea placeholder="Leaks, missing shingles, storm damage..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={submitting}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Get My Free Roof Assessment"}
        </Button>
      </form>
    </Form>
  );
}
