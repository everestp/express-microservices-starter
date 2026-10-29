# Add a Migration

Create the next zero-padded `.sql` file in the owning service's `migrations/` folder:

```sql
-- migrate:up
CREATE TABLE example (id uuid PRIMARY KEY DEFAULT gen_random_uuid());

-- migrate:down
DROP TABLE example;
```

Run the owning service's `migrate` script. Keep changes additive when possible and review rollback behavior before deployment.
