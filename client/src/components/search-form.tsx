import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSearchRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { InsertSearchRequest } from "@shared/schema";

interface SearchFormProps {
  onSearch: (data: InsertSearchRequest) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [placeholderText, setPlaceholderText] = useState("Describe what you're looking for...\n\n💡 Tips: Press Ctrl+Enter to start searching!");
  
  const form = useForm<InsertSearchRequest>({
    resolver: zodResolver(insertSearchRequestSchema),
    defaultValues: {
      searchQuery: "",
    },
  });

  useEffect(() => {
    // Generate dynamic placeholder examples on component mount
    const generatePlaceholderExamples = async () => {
      try {
        const response = await fetch('/api/placeholder-examples');
        const data = await response.json();
        if (data.examples) {
          const exampleText = data.examples.map((example: string) => `• ${example}`).join('\n');
          setPlaceholderText(`Describe what you're looking for...\n${exampleText}\n\n💡 Tips: Press Ctrl+Enter to start searching!`);
        }
      } catch (error) {
        // Keep default placeholder if API fails
        console.log('Using default placeholder examples');
      }
    };

    generatePlaceholderExamples();
  }, []);

  const onSubmit = (data: InsertSearchRequest) => {
    onSearch(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-2xl shadow-2xl p-8 mb-12 animate-slide-up hover-lift border border-purple-100">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={placeholderText}
                    rows={6}
                    className="form-input border-2 border-gray-200 rounded-xl focus:border-blue-500 resize-none text-base"
                    onKeyDown={handleKeyDown}
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
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Compare Now
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
