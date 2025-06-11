import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSearchRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Search, Loader2 } from "lucide-react";
import type { InsertSearchRequest } from "@shared/schema";

interface SearchFormProps {
  onSearch: (data: InsertSearchRequest) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const form = useForm<InsertSearchRequest>({
    resolver: zodResolver(insertSearchRequestSchema),
    defaultValues: {
      searchQuery: "",
    },
  });

  const onSubmit = (data: InsertSearchRequest) => {
    onSearch(data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 animate-slide-up hover-lift">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Describe what you're looking for...
• Project management software for small teams in Canada, budget under $50/month
• Video conferencing tools with screen sharing, works on mobile, GDPR compliant
• CRM systems for real estate, integrates with email marketing, under $100/user
• Cloud storage services, 1TB+ capacity, file sharing features, Europe-based servers"
                    rows={6}
                    className="form-input border-2 border-gray-200 rounded-xl focus:border-blue-500 resize-none text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find & Compare Products
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
